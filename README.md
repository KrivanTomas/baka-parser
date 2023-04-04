# baka-parser
A node.js app for scraping/parsing data from the public Bakalari timetable into usable .json files.

## How to use
- Make sure that node.js is installed by running `node -v`
- Navigate into the root of the repository

1. Install all dependencies
```cmd
> npm install
```
2. Run the app
```cmd
> node .
```

The generated .json files will be located in the `./cache/classes` folder

The parser also generates a `longtime.json` file, this file caches information, that rarely changes (classes, teachers, ..).
If you want the parser to update this information, manualy delete the file and run it again.

## Known issues
- When encountering an unknown pattern, the parsing will stop and the .json will not be generated **only** for that class.
