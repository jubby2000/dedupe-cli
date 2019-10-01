#!/usr/bin/env node
const program = require( 'commander' );
const fs = require( 'fs' );
const path = require( 'path' );

let file;
let dest;

// Use commander to provide options, help, and docs for the user
// Provides default destination for deduped file if none provided
program
    .name( 'dedupe' )
    .usage( '<filepath> [destination] -l' )
    .arguments( '<filepath> [destination]' )
    .action( ( filepath, destination ) => {
        file = filepath;
        filename = path.parse( path.basename( filepath ) ).name;
        dest = destination ? destination : path.dirname( filepath );
    } )
    .option( '-l --logs', 'Run with logging' )
    .parse( process.argv );

// Attempt to access given file, error and exit if invalid
try {
    if( !fs.existsSync( file ) ) {
        console.error( `${ file } 'does not exist'` );
        process.exit();
    };
} catch( err ) {
    if ( err ) {
        console.error( `${ file } 'is not readable'` );
        process.exit();
    }
}

// Validate destination provided, display an error and exit if invalid
try {
    fs.accessSync( dest, fs.constants.R_OK );
} catch ( err ) {
    console.log( `Directory: '${ dest }' does not exist` );
    process.exit();
}

console.log( 'Deduplicating leads...' );
const uniqueFilename = getUniqueFilename();
fs.writeFile(
    uniqueFilename,
    deduplicate( JSON.parse( fs.readFileSync( file ) ) ),
    ( err ) => {
        if( err ) {
            return console.error( 'Encountered an unexpected error, please try again' );
        }
        console.log( `Deduplication complete.\nFile saved to ${uniqueFilename}` );
    }
);

// Generate a unique filename if it exists in the file system
function getUniqueFilename() {
    let fileCount = 1;
    let success = false;
    let fileExistsString = '';
    while( !success ) {
        try {
            if( fs.existsSync( path.join( dest, `${ filename }-deduped${ fileExistsString }.json` ) ) ) {
                fileExistsString = ` (${ fileCount })`
                fileCount++;
            } else {
                success = true;
            }
        } catch( err ) {
            console.error( 'Encountered an unexpected error, please try again' );
            process.exit();
        }
    }
    return `${ dest }/${ filename }-deduped${ fileExistsString }.json`
}

function deduplicate( json ) {
    let leadsMap = {};
    // In order to keep track of the initial order of the leads in the array
    let leadsOrder = {};

    // Create a map with duplicate ids removed, preserving by latest date
    json.leads.forEach( ( entry, index ) => {
        if( leadsMap[ entry._id ] ) {
            if( getLeadByLatestDate( leadsMap[ entry._id ], entry ) === entry ) {
                if( program.logs ) {
                    console.log( 'Removed record: \n', leadsMap[ entry._id ] );
                }
                leadsMap[ entry._id ] = entry;
                leadsOrder[ entry._id ] = index;
            }
        } else {
            leadsMap[ entry._id ] = entry;
            leadsOrder[ entry._id ] = index;
        }
    } );
    const dedupedById = Object.values( leadsMap );
    leadsMap = {};

    // Using the reset leadsMap, remove email duplicates by latest date
    // and check their initial order if dates are equivalent
    dedupedById.forEach( entry => {
        if( leadsMap[ entry.email ] ) {
            if( getLeadByLatestDate( leadsMap[ entry.email ], entry, leadsOrder ) === entry ) {
                if( program.logs ) {
                    console.log( 'Removed record: \n', leadsMap[ entry.email ], '\n' );
                }
                leadsMap[ entry.email ] = entry;
            }
        } else {
            leadsMap[ entry.email ] = entry;
        }
    } );

    // Sort deduplicated leads by their initial position because objects
    // can't guarantee order
    const allDedupedLeads = Object.values( leadsMap ).sort( ( a, b ) => {
        if( leadsOrder[ a._id ] < leadsOrder[ b._id ] ) {
            return -1;
        }
        return 1;
    } ) ;

    const allDedupedLeadsJson = {
        leads : allDedupedLeads
    };
    return JSON.stringify( allDedupedLeadsJson, null, 2 );
}

// Compare date objects of two leads passed in, accepts an
// optional order object that is used after a map has been create
// so the order would be lost without it
function getLeadByLatestDate( leadOne, leadTwo, order ) {
    const dateOne = new Date( leadOne.entryDate );
    const dateTwo = new Date( leadTwo.entryDate );
    if( dateOne < dateTwo ) {
        return leadTwo;
    } else if( dateOne > dateTwo ) {
        return leadOne;
    }

    // This block is only hit if the dates for duplicate leads
    // are also identical. If no order object is provided, return the latter lead
    if( order === undefined ) {
        return leadTwo;

    // Otherwise, check the original order and return the latter
    } else if( order[ leadOne._id ] < order[ leadTwo._id ] ) {
        return leadTwo;
    }
    return leadOne;
}