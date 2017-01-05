// Options: --classes=parse --annotations --async-functions --jsx=newElement --member-variables --module-name --referrer=false --source-maps --spread-properties --types 
//import { Bindable } from 'decorators.js';
function Bindable(){}
function Event(){}

export class Toto extends HTMLElement {
	
  	
  	@Bindable
  	qwe;
  	
  	ghb:Boolean = truc.getMachin();
  
  	aze:String = live`<div/>`;
	
  	@Event
  	constructor( {aze,foo,qwe = <HBar/>} )
	{
		super();
      	this.appendChild(
          <Alert class="list" foo={bar} {...azea}>
          		<li>aze</li>
          </Alert>
        )
	}
	
	@Bindable({event:"aze",type:MyType})
    method( aze:NumberString = 3 ):void
	{
      	var test:Boolean, text:String = "aze";
	}
		

	@Bindable
	get prop(){}
	set prop(v){}
}