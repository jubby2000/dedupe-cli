# dedupe-cli

Deduplicate a given set of JSON data by `_id` and by `email` fields. This maintains the input order of the remaining objects.

## Installation
`git clone https://github.com/jubby2000/dedupe-cli`

`cd dedupe-cli`

`npm install -g .`

## Usage
`dedupe <source> [destination] -l`

`dedupe` : If installed globally, `dedupe` will work in any directory, usually where your file lives that you want to work with.

`source (required)` : Refers to the JSON file that you'd like to dedupe. Must be in the following format:
```json
{
  "leads" : [
    {
      "_id": "jkj238238jdsnfsj23",
      "email": "foo@bar.com",
      "firstName":  "John",
      "lastName": "Smith",
      "address": "123 Street St",
      "entryDate": "2014-05-07T17:30:20+00:00"
    },
    {
      "_id": "edu45238jdsnfsj23",
      "email": "mae@bar.com",
      "firstName":  "Ted",
      "lastName": "Masters",
      "address": "44 North Hampton St",
      "entryDate": "2014-05-07T17:31:20+00:00"
    },
  ]
}
```
`destination (optional)` : refers to the destination path where you would like the deduplicated file to be saved. If not provided, the path will default to the source file directory. Files will NOT be overwritten. Instead the file name will be appended in this manner: [filename]-deduped. Increasing values of numbers will be appended as necessary.

`-l or --logs` : adding this flag allows you to see the output in the command line of the entries that have been removed.
