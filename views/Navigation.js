export class Navigation extends cat.Element {
	constructor()
	{
		super(`<nav>
				<img class="logo" src="https://devingfx.github.io/Miaow/logo.svg"/>
				<button onclick="store.showAddPage()">
					${LANG('Current page')}
				</button>
				<hr/>
				<!--span>Collections</span-->
				<ul id="collections"></ul>
				<hr/>
				<button id="schemasBtn" onclick="store.showSchemasWindow()">
					${LANG('Schemas')}
				</button>
				<button id="settingsBtn" onclick="store.showSettings()">
					${LANG('Settings')}
				</button>
			</nav>`);
		this.$collections = this.find('#collections');
		debugger;
		this.on('click', 'button', e=> {
			this.find('.selected').removeClass('selected');
			e.target.classList.add('selected'); 
		})
	}
	get buttons()	 { return this;}//.find('button') }
	set buttons( v )  { this.append(v) }
	
	updateCollections()
	{
		this.$collections.empty();
		Object.getOwnPropertyNames(this.data)
			.map( n=> 
				this.$collections.append(
					`<li><button onclick="store.showInTable(store['${n}'])">${n}</button></li>`
				)
			)
	}
}