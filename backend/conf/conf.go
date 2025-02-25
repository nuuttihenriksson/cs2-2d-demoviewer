package conf

type Mode string

const MODE_DEV Mode = "dev"
const MODE_PROD Mode = "prod"

type Conf struct {
	// Demodir string `arg:"--demodir, env:DEMODIR" default:"" help:"Path to directory with demos."`
	Listen                  string `arg:"--listen, env:LISTEN" default:"127.0.0.1"`
	Port                    int    `arg:"--port, env:PORT" default:"8080" help:"Server port"`
	Mode                    Mode   `arg:"--mode, env:MODE" default:"dev" help:"Runtime environment mode, one of 'dev', 'prod'"`
}

type ConfSteamSvc struct {
	Listen         string `arg:"--listen, env:LISTEN" default:"127.0.0.1"`
	Port           int    `arg:"--port, env:PORT" default:"8081" help:"Server port"`
	Mode           Mode   `arg:"--mode, env:MODE" default:"dev" help:"Runtime environment mode, one of 'dev', 'prod'"`
}
