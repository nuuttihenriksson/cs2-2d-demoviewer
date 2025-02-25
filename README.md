
# CS2 2D Demo-viewer

A 2D demo viewer tool for Counter Strike 2. This is an edited version of sparkoo's demo viewer (see [Credits](#Credits)).

What has changed:
* Fixed bug with parsing Matchmaking demos.
* Store parsed demos to speed up re-viewing.
* Fixed smokes not showing up.
* Allow direct uploading of demos.

**NOTE:** Meant to be locally run with expected input. Currently has poor checking for unintended input.
  

## Building
You can build the tool from source code yourself if you'd like:

1. From root of the project run ```cd frontend && npm install && npm run build``` to build frontend.

2. From root of the project run ```cd backend && go mod download && go build``` to build the backend.

  

## Running
Check releases for a compiled version of the application:

1. Run the executable in a location where you want the /demos directory to be created.
2. Open a browser to localhost:8080 to access the application.

  

## Credits

* [sparkoo -- csgo-2d-demo-viewer](https://github.com/sparkoo/csgo-2d-demo-viewer): Original code for the player and backend.