package main

import (
	"compress/bzip2"
	"compress/gzip"
	"cs2-2d-backend/conf"
	"cs2-2d-backend/pkg/log"
	"cs2-2d-backend/pkg/message"
	"cs2-2d-backend/pkg/parser"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"embed"
	"net/http"
	"os"
	"bufio"
	"encoding/binary"
	"strings"
	"path/filepath"
	"github.com/alexflint/go-arg"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

var config *conf.Conf

//go:embed build/*
var embeddedFiles embed.FS

func allowCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	config = &conf.Conf{}
	arg.MustParse(config)
	createDemoDir()

	log.Init(config.Mode)
	defer log.Close()

	log.L().Debug("using config", zap.Any("config", config))
	server()
}

func handleMessages(in chan []byte, out chan []byte) {
	for msg := range in {
		var messageObj message.Message
		err := proto.Unmarshal(msg, &messageObj)
		if err != nil {
			log.Print("failed unmarshal websocket message", err)
		}
		switch messageObj.MsgType {
		case message.Message_PlayRequestType:
			go playDemo(out, messageObj.Demo)
		}
	}
}

func server() {
	mux := http.NewServeMux()
	frontendFS, err := fs.Sub(embeddedFiles, "build")
	if err != nil {
		fmt.Println("Error loading embedded frontend:", err)
		return
	}

	//mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("./assets"))))
	mux.Handle("/", http.FileServer(http.FS(frontendFS)))
	//mux.Handle("/player/", http.StripPrefix("/player", http.FileServer(http.Dir("web/player/build"))))

	mux.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		// Upgrade our raw HTTP connection to a websocket based one
		upgrader := websocket.Upgrader{}
		if request.Host == "localhost:8080" {
			upgrader.CheckOrigin = func(r *http.Request) bool {
				return true
			}
		}
		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Print("Error during connection upgradation:", err)
			return
		}

		out := make(chan []byte)
		in := make(chan []byte)
		go handleMessages(in, out)

		// out routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [out] '%s'", closeErr.Error())
				}
			}()

			for msg := range out {
				err = conn.WriteMessage(websocket.BinaryMessage, msg)
				if err != nil {
					log.Println("Error during message writing:", err)
					break
				}
			}
		}()

		// in routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [in] '%s'", closeErr.Error())
				}
			}()

			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					closeErr, isCloseErr := err.(*websocket.CloseError)
					if !isCloseErr || closeErr.Code != websocket.CloseGoingAway {
						log.Println("Error during message reading: ", err)
					}
					break
				}
				in <- msg
			}
		}()
	})
	mux.HandleFunc("/upload", handleUpload)
	mux.HandleFunc("/demos", handleListDemos)
	log.L().Info("HTTP server listening on ...", zap.String("listen", config.Listen), zap.Int("port", config.Port))
	// log.Println("Listening on ", config.Port, " ...")
	// listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), allowCORS(mux))
	listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), mux)
	log.L().Fatal("failed to listen", zap.Error(listenErr))
}

func sendMessage(msg *message.Message, out chan []byte) {
	payload, protoErr := proto.Marshal(msg)
	if protoErr != nil {
		sendError(protoErr.Error(), out)
	}
	out <- payload
}

func sendError(errorMessage string, out chan []byte) {
	log.Printf("sending error to client: '%s'", errorMessage)
	msg := &message.Message{
		MsgType: message.Message_ErrorType,
		Message: &errorMessage,
	}
	sendMessage(msg, out)
}

func createDemoDir() {
	if _, err := os.Stat("./demos"); os.IsNotExist(err) {
		os.Mkdir("./demos", os.ModePerm)
	}
}

func handleListDemos(w http.ResponseWriter, r *http.Request) {
	demos := []string{}
	filepath.Walk("./demos", func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() {
			demos = append(demos, strings.TrimSuffix(info.Name(), ".pb"))
		}
		return nil
	})

	json.NewEncoder(w).Encode(demos)
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(500 << 20)
	file, handler, err := r.FormFile("demoFile")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	fileBaseName := filepath.Base(handler.Filename)
	fileBaseName = strings.TrimSuffix(fileBaseName, ".gz")
	fileBaseName = strings.TrimSuffix(fileBaseName, ".bz2")
	fileBaseName = strings.TrimSuffix(fileBaseName, ".dem")

	filePath := filepath.Join("./demos", handler.Filename)

	outFile, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()

	// Handle decompression
	var reader io.Reader = file
	if strings.HasSuffix(handler.Filename, ".gz") {
		gzr, err := gzip.NewReader(file)
		if err != nil {
			http.Error(w, "Error decompressing gzip file", http.StatusInternalServerError)
			return
		}
		defer gzr.Close()
		reader = gzr
	} else if strings.HasSuffix(handler.Filename, ".bz2") {
		reader = bzip2.NewReader(file)
	}

	if _, err := io.Copy(outFile, reader); err != nil {
		http.Error(w, "Error writing decompressed file", http.StatusInternalServerError)
		return
	}

	// Parse the demo file and save parsed results
	outFile.Close()
	err = parseDemoFile(filePath)
	if err != nil {
		http.Error(w, "Error parsing demo file", http.StatusInternalServerError)
		return
	}

	// Delete original file after parsing
	os.Remove(filePath)

	w.Write([]byte("File uploaded, parsed, and original deleted successfully"))
}

func parseDemoFile(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	parsedFilePath := filePath
	if strings.HasSuffix(filePath, ".bz2") {
		parsedFilePath = strings.TrimSuffix(filePath, ".bz2")
	}
	if strings.HasSuffix(filePath, ".gz") {
		parsedFilePath = strings.TrimSuffix(filePath, ".gz")
	}
	if strings.HasSuffix(parsedFilePath, ".dem") {
		parsedFilePath = strings.TrimSuffix(parsedFilePath, ".dem")
	}
	parsedFilePath = parsedFilePath + ".pb"

	outFile, err := os.Create(parsedFilePath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	err = parser.Parse(file, func(msg *message.Message, tick demoinfocs.GameState) {
		protoMsg, err := proto.Marshal(msg)
		if err == nil {
			length := uint32(len(protoMsg))
			binary.Write(outFile, binary.LittleEndian, length) // Write length first
			outFile.Write(protoMsg)                             // Write message
		}
	})
	outFile.Close()
	return err
}

func playDemo(out chan []byte, demo *message.Demo) {
	log.L().Info("Playing demo", zap.String("matchId", demo.MatchId))

	if demo.MatchId == "" {
		sendError("No matchId provided", out)
		return
	}

	parsedFilePath := fmt.Sprintf("./demos/%s.pb", demo.MatchId)
	file, err := os.Open(parsedFilePath)
	if err != nil {
		sendError("Failed to open parsed demo file", out)
		return
	}
	defer file.Close()

	reader := bufio.NewReader(file)
	for {
		var length uint32
		err := binary.Read(reader, binary.LittleEndian, &length)
		if err == io.EOF {
			break
		}
		if err != nil {
			sendError("Error reading message length", out)
			return
		}

		msgData := make([]byte, length)
		_, err = io.ReadFull(reader, msgData)
		if err != nil {
			sendError("Error reading message data", out)
			return
		}

		var msg message.Message
		err = proto.Unmarshal(msgData, &msg)
		if err != nil {
			sendError("Error decoding message before sending", out)
			continue
		}

		//fmt.Print(msg.String() + "\n")
		payload, protoErr := proto.Marshal(&msg)

		if protoErr != nil {
			sendError(protoErr.Error(), out)
		}

		out <- payload
		//time.Sleep(50 * time.Millisecond)
	}
}

func obtainDemoFile(demoID string) ([]byte, error) {
	parsedFilePath := fmt.Sprintf("./demos/%s", demoID)

	parsedData, err := os.ReadFile(parsedFilePath)
	if err != nil {
		return nil, fmt.Errorf("error reading parsed demo file: %w", err)
	}

	return parsedData, nil
}