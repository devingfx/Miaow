Object.defineProperty( window, 'language', {
	get: ()=> document.documentElement.attributes.lang,
	set: ( L )=> document.documentElement.setAttribute( 'lang', L )
})

var LANG = mess=> {
	if( !LANG.all.length )
		LANG[navigator.language] = {};
	
	if( !LANG[LANG.all[0]][mess] )
		LANG[LANG.all[0]][mess] = mess;
	
	return LANG.all
				.map( ln=> LANG[ln][mess] ? `<lang ${ln}>${LANG[ln][mess]}</lang>` : '')
				.join('')
}
Object.defineProperty( LANG, 'all', {
	get: ()=> Object.getOwnPropertyNames( LANG )
				.filter( s=> s.length == 2 )
});
LANG.en = {}




// Object.defineProperty( window, 'language', {
// 	get: ()=> document.documentElement.attributes.lang,
// 	set: ( L )=> {
//         L = L || document.documentElement.attributes.lang.value;
//         // debugger;
//         Array.from( document.querySelectorAll('lang') )
//         	.map( lang=> Array.from( lang.attributes )
//         					.some( attr=> ~LANG.all.indexOf(attr.name) )
//         					 && (lang.style.display='none') );
        	
//         Array.from( document.querySelectorAll(`lang[${L}]`) )
//         	.map( lang=> (lang.style.display='inline') );
        
//         document.documentElement.setAttribute( 'lang', L );
// 	}
// })

// var LANG = mess=> {
// 	var out='';
// 	if( LANG[LANG[LANG.DEFAULT]][mess] )
// 		for(let ln in LANG)
// 			out += LANG[ln][mess] ? `<lang ${ln}>${LANG[ln][mess]}</lang>` : '';
// 	else
// 	{
// 		LANG[LANG[LANG.DEFAULT]][mess] = mess;
// 		for(let ln in LANG)
// 			out += `<lang ${ln}${ln==LANG[LANG.DEFAULT]?'':' default'}>${mess}</lang>`;
// 	// ? `<lang ${LANG[LANG.DEFAULT]}>${LANG[LANG[LANG.DEFAULT]][mess];}</lang>`
// 	}
// 	return out;
// }
// LANG.DEFAULT = Symbol`LANG.DEFAULT`;
// LANG.options = document.currentScript.attributes;
// // LANG.options.editor && 
// Object.defineProperty( LANG, 'all', {
// 	get: ()=> Object.getOwnPropertyNames( LANG )
// 				.filter( s=> s.length == 2 )
// });

// LANG[LANG.DEFAULT] = LANG.options.default ? LANG.options.default.value : 'en';
// LANG[LANG[LANG.DEFAULT]]={}





// in a file
// LANG.en = {
// 	"This page": "This page",
// 	"Save": "Save",
// 	"Cancel": "Cancel",
// 	"Delete": "Delete",
// 	"Current page": "Cette page",
// 	"Schemas": "Schémas",
// 	"Settings": "Préférences"
// };
LANG.fr = {
	"This page": "Cette page",
	"Save": "Enregistrer",
	"Cancel": "Annuler",
	"Delete": "Supprimer",
	"Current page": "Cette page",
	"Schemas": "Schémas",
	"Settings": "Préférences",
	"Language": "Langue"
};

language = navigator.language || LANG[LANG.DEFAULT];

// LANG('Save') // <lang en>Save</lang><lang fr>Enregistrer</lang>
// LANG('Cancel') // <lang en>Cancel</lang> + LANG['en']['Cancel'] = 'Cancel'


let s = document.createElement('style');
s.innerHTML = `
lang {
    display: none;
}
${LANG.all.map( L=>`
	[lang=${L}] lang[${L}] {
	    display: inline;
	}`
).join('')}
`;
document.head.append(s);