# baka-parser 
A node.js app for scraping/parsing data from the public Bakalari timetable into usable .json files.

# 🛑Currently broken🛑
The `how to use` section is currently only for reference, and the app will throw an error, even if done correctly.

I am working on a TypeScript rewrite. I will update the README when the TypeScript reaches the featureset of the legacy code.

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
