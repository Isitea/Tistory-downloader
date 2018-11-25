"use strict";
class HTML {
    static fillAppendChildren () {
        if ( !Node.prototype.appendChildren ) {
            Node.prototype.appendChildren = function ( children ) {
                if ( children instanceof NodeList ) {
                    while ( children.length > 0 ) {
                        this.appendChild( children[0] );
                    }
                } else {
                    throw new TypeError( "Passed parameter on method appendChildren under Node must be a NodeList." );
                }
            }
        }
    }

    static render ( structure, preset = {} ) {
        this.fillAppendChildren();
        if ( structure instanceof Node || structure instanceof NodeList ) return structure;
        let fragment = document.createDocumentFragment();
        if ( structure instanceof Object ) {
            if ( !( structure instanceof Array ) ) { structure = [ structure ]; }
            for ( const item of structure ) {
                let node;
                if ( item instanceof Node ) { node = item; }
                else if ( typeof item === "string" ) { node = document.createTextNode( item ); }
                else if ( !( item instanceof Array ) && item instanceof Object ) {
                    const [[ name, attributes ]] = Object.entries( item );
                    if ( name in preset ) {
                        if ( !( attributes._todo instanceof Array ) ) { attributes._todo = []; }
                        attributes._todo.unshift( preset[name] );
                    }
                    node = this.setAttributes( document.createElement( name ), attributes );
                }
                if ( node ) fragment.appendChild( node );
            }
        }

        return fragment.childNodes;
    }

    static setAttributes ( node, attributes ) {
        const children = this.render( attributes._child );
        for ( const [ key, value ] of Object.entries( attributes ) ) {
            switch ( key ) {
                case "_child":
                case "_todo": {
                    break;
                }
                case "Listeners": {
                    for ( const { type, listener, options } of value ) { node.addEventListener( type, listener, options || {} ); }
                    break;
                }
                case "dataset": {
                    Object.assign( node.dataset, value );
                    break;
                }
                case "style": {
                    node.style.cssText = value;
                    break;
                }
                default: {
                    if ( value === "true" ) { node.setAttributeNode( document.createAttribute( key ) ); }
                    else {
                        let attr = document.createAttribute( key );
                        attr.value = value;
                        node.setAttributeNode( attr );
                    }
                    
                }
            }
        }
        if ( children.length ) { node.appendChildren( children ); }

        return ( attributes._todo || [] ).reduce( ( node, fn ) => fn( node ), node );
    }

    static remove ( node, uncover = false ) {
        if ( !node.parentNode ) return false;
        if ( uncover ) {
            for ( let item of [ ...node.parentNode.childNodes ] ) {
                if ( item === node ) { for ( let child of [ ...node ] ) { node.parentNode.appendChild( child ); } }
                else { node.parentNode.appendChild( item ); }
            }
            node.parentNode.removeChild( node );
        }
        else { node.parentNode.removeChild( node ); }
    }
}

function getMedia ( url ) {
    return new Promise( ( resolve, reject ) => {
        let xhr = new XMLHttpRequest();
        xhr.open( "GET", url, true );
        xhr.responseType = "blob";
        xhr.addEventListener( "load", e => {
            resolve( {
                blob: xhr.response,
                filename: xhr.getResponseHeader( "content-disposition" ).split( '"' )[1]
            } );
        } );
        xhr.addEventListener( "error", e => { console.log( e ); reject( new Blob( [ url ], { type: "plain/text" } ) ); } );
        xhr.send();
    } );
}

let files = document.querySelectorAll( 'a[href*=attachment]' ), list = [];
for ( let item of files ) {
    list.push( getMedia( item.href ).then( ( { blob, filename: download } ) => {
        let [ anchor ] = HTML.render( {
            a: {
                href: URL.createObjectURL( blob ),
                download,
            }
        } );
        //document.body.appendChild( anchor );
        anchor.click();

        return true;
    } ) );
}
Promise.all( list ).then( () => {
    setTimeout( () => {
        window.close();
    }, 250 );
} )
