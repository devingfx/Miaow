Object.defineProperty( window, 'language', {
	get: ()=> document.documentElement.attributes.lang,
	set: ( L )=> {
        L = L || document.documentElement.attributes.lang.value;
        
        Array.From( document.querySelectorAll('lang') )
        	.map( lang=> (lang.style.display='none') );
        	
        Array.From( document.querySelectorAll(`lang[${L}]`) )
        	.map( lang=> (lang.style.display='inline') );
        
        document.documentElement.setAttribute( 'lang', L );
	}
})
var LANG = mess=> {
	var out='';
	if( LANG[LANG[LANG.DEFAULT]][mess] )
		for(let ln in LANG)
			out += LANG[ln][mess] ? `<lang ${ln}>${LANG[ln][mess]}</lang>` : '';
	else
	{
		LANG[LANG[LANG.DEFAULT]][mess] = mess;
		out += `<lang ${LANG[LANG.DEFAULT]}>${mess}</lang>`;
	// ? `<lang ${LANG[LANG.DEFAULT]}>${LANG[LANG[LANG.DEFAULT]][mess];}</lang>`
	}
	return out;
}
LANG.DEFAULT = Symbol`LANG.DEFAULT`;
LANG.options = document.currentScript.attributes;

LANG[LANG.DEFAULT] = LANG.options.default ? LANG.options.default.value : 'en';
LANG[LANG[LANG.DEFAULT]]={}

language = navigator.language || LANG[LANG.DEFAULT];


LANG[LANG[LANG.DEFAULT]][mess]=mess;


// in a file
LANG.en = {}
LANG.fr = {}
LANG['en'][mess]
LANG['en']['Save'] = 'Save'
LANG['fr']['Save'] = 'Enregistrer'

LANG('Save') // <lang en>Save</lang><lang fr>Enregistrer</lang>
LANG('Cancel') // <lang en>Cancel</lang> + LANG['en']['Cancel'] = 'Cancel'