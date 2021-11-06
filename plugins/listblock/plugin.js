/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.add( 'listblock', {
	requires: 'panel',

	onLoad: function() {
		var list = CKEDITOR.addTemplate( 'panel-list', '<ul role="presentation" class="cke_panel_list">{items}</ul>' ),
			listItem = CKEDITOR.addTemplate( 'panel-list-item', '<li id="{id}" class="cke_panel_listItem" role=presentation>' +
				'<a id="{id}_option" _cke_focus=1 hidefocus=true' +
					' title="{title}"' +
					' href="javascript:void(\'{val}\')" ' +
					' {onclick}="CKEDITOR.tools.callFunction({clickFn},\'{val}\', \'oBlur\', event); return false;"' + // #188
						' role="option">' +
					'{text}' +
				'</a>' +
				'</li>' ),
			listGroup = CKEDITOR.addTemplate( 'panel-list-group', '<h1 id="{id}" class="cke_panel_grouptitle" role="presentation" >{label}</h1>' ),
			reSingleQuote = /\'/g,
			escapeSingleQuotes = function( str ) {
				return str.replace( reSingleQuote, '\\\'' );
			};
		var fontSizeSetBar = CKEDITOR.addTemplate('panel-bottom-bar', '<div class="panel-bottom-bar"><div class="input-wrapper {lightClass}" title=""><div class="tooltip"><div class="arrow"></div>{title}</div><input type="text" value="{value}" onfocus="CKEDITOR.tools.callFunction({onfocusEvent}, event)" onblur="CKEDITOR.tools.callFunction({onblurEvent}, event)" maxLength="3" /><div class="unit">px</div></div><div class="control-wrapper" title=""> <div class="save-btn" onclick="CKEDITOR.tools.callFunction({onSaveFont}, event)">{saveText}</div> <div class="reset-btn" onclick="CKEDITOR.tools.callFunction({onResetFont}, event)">{resetText}</div></div></div>' )
		CKEDITOR.ui.panel.prototype.addListBlock = function( name, definition ) {
			return this.addBlock( name, new CKEDITOR.ui.listBlock( this.getHolderElement(), definition ) );
		};

		CKEDITOR.ui.listBlock = CKEDITOR.tools.createClass( {
			base: CKEDITOR.ui.panel.block,

			$: function( blockHolder, blockDefinition ) {
				blockDefinition = blockDefinition || {};

				var attribs = blockDefinition.attributes || ( blockDefinition.attributes = {} );
				( this.multiSelect = !!blockDefinition.multiSelect ) && ( attribs[ 'aria-multiselectable' ] = true );
				// Provide default role of 'listbox'.
				!attribs.role && ( attribs.role = 'listbox' );

				// Call the base contructor.
				this.base.apply( this, arguments );

				// Set the proper a11y attributes.
				this.element.setAttribute( 'role', attribs.role );

				var keys = this.keys;
				keys[ 40 ] = 'next'; // ARROW-DOWN
				keys[ 9 ] = 'next'; // TAB
				keys[ 38 ] = 'prev'; // ARROW-UP
				keys[ CKEDITOR.SHIFT + 9 ] = 'prev'; // SHIFT + TAB
				keys[ 32 ] = CKEDITOR.env.ie ? 'mouseup' : 'click'; // SPACE
				CKEDITOR.env.ie && ( keys[ 13 ] = 'mouseup' ); // Manage ENTER, since onclick is blocked in IE (#8041).

				this._.pendingHtml = [];
				this._.pendingList = [];
				this._.items = {};
				this._.groups = {};
				this._.barParams = { typeTooltip: '' };
			},

			_: {
				close: function() {
					if ( this._.started ) {
						var output = list.output( { items: this._.pendingList.join( '' ) } );
						this._.pendingList = [];
						this._.pendingHtml.push( output );
						this._.pendingHtml.push( fontSizeSetBar.output( this._.barParams ) );
						delete this._.started;
					}
				},

				getClick: function() {
					if ( !this._.click ) {
						this._.click = CKEDITOR.tools.addFunction( function( value, blockBlur, event ) {
							var marked = this.toggle( value );
							if ( this.onClick )
								this.onClick( value, marked, blockBlur, event );
						}, this );
					}
					return this._.click;
				},
			},

			proto: {
				add: function( value, html, title ) {
					var id = CKEDITOR.tools.getNextId();

					if ( !this._.started ) {
						this._.started = 1;
						this._.size = this._.size || 0;
					}

					this._.items[ value ] = id;

					var data = {
						id: id,
						val: escapeSingleQuotes( CKEDITOR.tools.htmlEncodeAttr( value ) ),
						onclick: CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : 'onclick',
						clickFn: this._.getClick(),
						title: CKEDITOR.tools.htmlEncodeAttr( title || value ),
						text: html || value
					};

					this._.pendingList.push( listItem.output( data ) );
				},

				initPixelSize: function(params) {
					var inputFocus = CKEDITOR.tools.addFunction( function(event) {
						if ( params.onfocusEvent )
							params.onfocusEvent(event);
					});
					var inputUnFocus = CKEDITOR.tools.addFunction( function(event) {
						if ( params.onblurEvent )
							params.onblurEvent(event);
					});

					var onResetFont = CKEDITOR.tools.addFunction( function(event) {
						if ( params.onResetFont )
							params.onResetFont(event);
					});

					var onSaveFont = CKEDITOR.tools.addFunction( function(event) {
						if ( params.onSaveFont )
							params.onSaveFont(event);
					});



					var data = {
						title: params.title,
						saveText: params.saveText,
						resetText: params.resetText,
						onclick: CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : 'onclick',
						clickFn: this._.getClick(),
						onfocusEvent: inputFocus,
						onblurEvent: inputUnFocus,
						onResetFont: onResetFont,
						onSaveFont: onSaveFont,
						value: params.value,
						lightClass: params.lightClass,
					}
					this._.barParams = data;
				},

				startGroup: function( title ) {
					this._.close();

					var id = CKEDITOR.tools.getNextId();

					this._.groups[ title ] = id;

					this._.pendingHtml.push( listGroup.output( { id: id, label: title } ) );
				},

				commit: function() {
					this._.close();
					this.element.appendHtml( this._.pendingHtml.join( '' ) );
					delete this._.size;

					this._.pendingHtml = [];
				},

				toggle: function( value ) {
					var isMarked = this.isMarked( value );

					if ( isMarked )
						this.unmark( value );
					else
						this.mark( value );

					return !isMarked;
				},

				hideGroup: function( groupTitle ) {
					var group = this.element.getDocument().getById( this._.groups[ groupTitle ] ),
						list = group && group.getNext();

					if ( group ) {
						group.setStyle( 'display', 'none' );

						if ( list && list.getName() == 'ul' )
							list.setStyle( 'display', 'none' );
					}
				},

				hideItem: function( value ) {
					this.element.getDocument().getById( this._.items[ value ] ).setStyle( 'display', 'none' );
				},

				showAll: function() {
					var items = this._.items,
						groups = this._.groups,
						doc = this.element.getDocument();

					for ( var value in items ) {
						doc.getById( items[ value ] ).setStyle( 'display', '' );
					}

					for ( var title in groups ) {
						var group = doc.getById( groups[ title ] ),
							list = group.getNext();

						group.setStyle( 'display', '' );

						if ( list && list.getName() == 'ul' )
							list.setStyle( 'display', '' );
					}
				},

				mark: function( value ) {
					if ( !this.multiSelect )
						this.unmarkAll();

					var itemId = this._.items[ value ],
						item = this.element.getDocument().getById( itemId );
					item.addClass( 'cke_selected' );

					this.element.getDocument().getById( itemId + '_option' ).setAttribute( 'aria-selected', true );
					this.onMark && this.onMark( item );
				},

				unmark: function( value ) {
					var doc = this.element.getDocument(),
						itemId = this._.items[ value ],
						item = doc.getById( itemId );

					item.removeClass( 'cke_selected' );
					doc.getById( itemId + '_option' ).removeAttribute( 'aria-selected' );

					this.onUnmark && this.onUnmark( item );
				},

				unmarkAll: function() {
					var items = this._.items,
						doc = this.element.getDocument();

					for ( var value in items ) {
						var itemId = items[ value ];

						doc.getById( itemId ).removeClass( 'cke_selected' );
						doc.getById( itemId + '_option' ).removeAttribute( 'aria-selected' );
					}

					this.onUnmark && this.onUnmark();
				},

				isMarked: function( value ) {
					return this.element.getDocument().getById( this._.items[ value ] ).hasClass( 'cke_selected' );
				},

				focus: function( value ) {
					this._.focusIndex = -1;

					var links = this.element.getElementsByTag( 'a' ),
						link,
						selected,
						i = -1;

					if ( value ) {
						selected = this.element.getDocument().getById( this._.items[ value ] ).getFirst();

						while ( ( link = links.getItem( ++i ) ) ) {
							if ( link.equals( selected ) ) {
								this._.focusIndex = i;
								break;
							}
						}
					}
					else {
						this.element.focus();
					}

					selected && setTimeout( function() {
						selected.focus();
					}, 0 );
				}
			}
		} );
	}
} );
