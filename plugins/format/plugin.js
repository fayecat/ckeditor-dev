/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.add( 'format', {
	requires: 'richcombo',
	// jscs:disable maximumLineLength
	lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
	// jscs:enable maximumLineLength
	init: function( editor ) {
		if ( editor.blockless )
			return;

		var config = editor.config,
			lang = editor.lang.format;

		// Gets the list of tags from the settings.
		var tags = config.format_tags.split( ';' );

		// Create style objects for all defined styles.

		var styles = {},
			stylesCount = 0,
			allowedContent = [];
		for ( var i = 0; i < tags.length; i++ ) {
			var tag = tags[ i ];
			var style = new CKEDITOR.style( config[ 'format_' + tag ] );
			if ( !editor.filter.customConfig || editor.filter.check( style ) ) {
				stylesCount++;
				styles[ tag ] = style;
				styles[ tag ]._.enterMode = editor.config.enterMode;
				allowedContent.push( style );
			}
		}

		// Hide entire combo when all formats are rejected.
		if ( stylesCount === 0 )
			return;

		editor.ui.addRichCombo( 'Format', {
			label: '',
			toolbar: 'styles,20',

			allowedContent: allowedContent,

			panel: {
				css: [ CKEDITOR.skin.getPath( 'editor' ) ].concat( config.contentsCss ),
				multiSelect: false,
			},

			init: function() {
				// this.startGroup( editor.lang.format.label );

				var resetEvent = function () { this.unmarkAll.call(this) }

				resetEvent = resetEvent.bind(this)

				for ( var tag in styles ) {
					var label = editor.lang.format[tag];

					// Add the tag entry to the panel list.
					this.add( tag, label, 'content-' + tag );
				}

				var onfocusEvent = function(ev) {
					var parent = $(ev.target).parents('.panel-bottom-bar')

					parent.find('.save-btn').show()
					parent.find('.reset-btn').hide()
				}


				var onblurEvent = function(ev) {
					var parent = $(ev.target).parents('.panel-bottom-bar')
					setTimeout(function() {
						parent.find('.save-btn').hide();
						parent.find('.reset-btn').show();
					}, 300)
				}

				var saveFont = function(ev) {
					var parent = $(ev.target).parents('.panel-bottom-bar')
					var inputNode = parent.find('input')
					inputNode.focus();
					var value = inputNode.val()

					value = Number(value)
					if (value === 'NaN') {

						value = editor.config.getTextFontSize()
					} else {
						if (value > 120) {
							value = 120
						} else if (value < 6) {
							value = 6
						}
					}
					inputNode.val(value)
					editor.fire( 'saveSnapshot' );

					var currentNode = editor.elementPath().block.$

					var tagName = currentNode.localName
					// var className = currentNode.className
					// var fontSize = currentNode.style.fontSize
					// var textAlign = currentNode.style.textAlign

					var styleString = ''

					var styleObj = { attributes: {} }

					if (tagName) {
						styleObj.element = tagName
					}


					if (value) {
						styleString += ('font-size:' + value + 'px;')
					}


					if (styleString) {
						styleObj.attributes.style = styleString
					}


					var style = new CKEDITOR.style(styleObj)
					editor.applyStyle(style)
					setTimeout( function() {
						editor.fire( 'saveSnapshot' );
					}, 0 );
					resetEvent()
					setTimeout(function() {
						parent.find('.save-btn').show()
						parent.find('.reset-btn').hide()
					}, 300)
				}

				var resetFont = function() {
					editor.fire( 'saveSnapshot' );

					var currentNode = editor.elementPath().block.$

					var tagName = currentNode.localName
					var className = currentNode.className
					var fontSize = currentNode.style.fontSize
					var textAlign = currentNode.style.textAlign

					var styleString = ''

					var styleObj = { attributes: {} }

					if (tagName) {
						styleObj.element = tagName
					}



					if (className) {
						styleObj.attributes['class'] = className
					}

					if (fontSize) {
						styleString += ('font-size:' + fontSize + ';')
					}


					if (styleString) {
						styleObj.attributes.style = styleString
					}


					var style = new CKEDITOR.style(styleObj)
					editor.removeStyle(style)
					setTimeout( function() {
						editor.fire( 'saveSnapshot' );
					}, 0 );
					resetEvent()
				}

				var phrases = editor.config.getFontInputPhase() || {}

				var data = {
					value: editor.config.getTextFontSize(),
					title: phrases.inputTooltip,
					saveText: phrases.save,
					resetText: phrases.reset,
					onfocusEvent: onfocusEvent,
					onblurEvent: onblurEvent,
					onSaveFont: saveFont,
					onResetFont: resetFont
				 }

				this.initPixelSize(data)

			},

			onClick: function( value, marked, event ) {
				editor.fire( 'saveSnapshot' );


				var parent = $(event.target).parents('.cke_panel_block')
				var inputNode = parent.find('.panel-bottom-bar input')

				var currentNode = editor.elementPath().block.$
				var fontSize = currentNode.style.fontSize
				var textAlign = currentNode.style.textAlign
				var styleString = ''
				var config = CKEDITOR.config['format_' + value]
				var styleObj = { element: config.element, attributes: config.attributes }
				var fontValue = config.fontSize || ''

				if (config.fontSize) {
					if (config.element == 'p' || config.element == 'h5') {
						fontValue = editor.config.getTextFontSize() + 'px'
					}

					if (config.element == 'div') {
						fontValue = parseInt(editor.config.getTextFontSize() * 0.83) + 'px'
					}

					styleString += ('font-size:' + fontValue + ';')
				}


				if (textAlign) {
					styleString += ('text-align:' + textAlign + ';')
				}

				if (styleString) {
					styleObj.attributes.style = styleString
				}

				var style = new CKEDITOR.style(styleObj)

				var status = style.checkActive( editor.elementPath(), editor ) ? 'removeStyle' : 'applyStyle'

				editor[status]( style );

				if (status === 'applyStyle') {
					inputNode.val(fontValue.replace('px', ''))
				} else {
					inputNode.val(editor.config.getTextFontSize())
				}

				// Save the undo snapshot after all changes are affected. (#4899)
				setTimeout( function() {
					editor.fire( 'saveSnapshot' );
				}, 0 );
			},

			onRender: function() {
				editor.on( 'selectionChange', function( ev ) {
					var currentTag = this.getValue(),
						elementPath = ev.data.path;

					this.refresh();

					for ( var tag in styles ) {
						if ( styles[ tag ].checkActive( elementPath, editor ) ) {
							if ( tag != currentTag )
								this.setValue( tag, editor.lang.format[tag] );
							return;
						}
					}

					// If no styles match, just empty it.
					this.setValue( '' );

				}, this );
			},

			onOpen: function() {
				this.showAll();
				for ( var name in styles ) {
					var style = styles[ name ];

					// Check if that style is enabled in activeFilter.
					if ( !editor.activeFilter.check( style ) )
						this.hideItem( name );

				}
			},

			refresh: function() {
				var elementPath = editor.elementPath();

				if ( !elementPath )
						return;

				// Check if element path contains 'p' element.
				if ( !elementPath.isContextFor( 'p' ) ) {
					this.setState( CKEDITOR.TRISTATE_DISABLED );
					return;
				}

				// Check if there is any available style.
				for ( var name in styles ) {
					if ( editor.activeFilter.check( styles[ name ] ) )
						return;
				}
				this.setState( CKEDITOR.TRISTATE_DISABLED );
			}
		} );
	}
} );

/**
 * A list of semicolon-separated style names (by default: tags) representing
 * the style definition for each entry to be displayed in the Format drop-down list
 * in the toolbar. Each entry must have a corresponding configuration in a
 * setting named `'format_(tagName)'`. For example, the `'p'` entry has its
 * definition taken from [config.format_p](#!/api/CKEDITOR.config-cfg-format_p).
 *
 *		config.format_tags = 'p;h2;h3;pre';
 *
 * @cfg {String} [format_tags='p;h1;h2;h3;h4;h5;h6;pre;address;div']
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_tags = 'h1;h2;h3;h4;h5;p;div';

/**
 * The style definition to be used to apply the `Normal` format.
 *
 *		config.format_p = { element: 'p', attributes: { 'class': 'normalPara' } };
 *
 * @cfg {Object} [format_p={ element: 'p' }]
 * @member CKEDITOR.config
 *
 *
 */

CKEDITOR.config.format_p = { element: 'p', attributes: { 'class': 'normalPara' }, fontSize: '100%'  };

/**
 * The style definition to be used to apply the `Normal (DIV)` format.
 *
 *		config.format_div = { element: 'div', attributes: { 'class': 'normalDiv' } };
 *
 * @cfg {Object} [format_div={ element: 'div' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_div = { element: 'div', attributes: { 'class': 'normalDiv' }, fontSize: '83%' };

/**
 * The style definition to be used to apply the `Formatted` format.
 *
 *		config.format_pre = { element: 'pre', attributes: { 'class': 'code' } };
 *
 * @cfg {Object} [format_pre={ element: 'pre' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_pre = { element: 'pre' };

/**
 * The style definition to be used to apply the `Address` format.
 *
 *		config.format_address = { element: 'address', attributes: { 'class': 'styledAddress' } };
 *
 * @cfg {Object} [format_address={ element: 'address' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_address = { element: 'address' };

/**
 * The style definition to be used to apply the `Heading 1` format.
 *
 *		config.format_h1 = { element: 'h1', attributes: { 'class': 'contentTitle1' } };
 *
 * @cfg {Object} [format_h1={ element: 'h1' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h1 = { element: 'h1', attributes: { 'class': 'h1Tag' }, fontSize: '48px' };

/**
 * The style definition to be used to apply the `Heading 2` format.
 *
 *		config.format_h2 = { element: 'h2', attributes: { 'class': 'contentTitle2' } };
 *
 * @cfg {Object} [format_h2={ element: 'h2' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h2 = { element: 'h2', attributes: { 'class': 'h2Tag' }, fontSize: '28px' };

/**
 * The style definition to be used to apply the `Heading 3` format.
 *
 *		config.format_h3 = { element: 'h3', attributes: { 'class': 'contentTitle3' } };
 *
 * @cfg {Object} [format_h3={ element: 'h3' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h3 = { element: 'h3', attributes: { 'class': 'h3Tag' }, fontSize: '24px' };

/**
 * The style definition to be used to apply the `Heading 4` format.
 *
 *		config.format_h4 = { element: 'h4', attributes: { 'class': 'contentTitle4' } };
 *
 * @cfg {Object} [format_h4={ element: 'h4' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h4 = { element: 'h4', attributes: { 'class': 'h4Tag' }, fontSize: '20px' };

/**
 * The style definition to be used to apply the `Heading 5` format.
 *
 *		config.format_h5 = { element: 'h5', attributes: { 'class': 'contentTitle5' } };
 *
 * @cfg {Object} [format_h5={ element: 'h5' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h5 = { element: 'h5', attributes: { 'class': 'h5Tag' }, fontSize: '100%' };

/**
 * The style definition to be used to apply the `Heading 6` format.
 *
 *		config.format_h6 = { element: 'h6', attributes: { 'class': 'contentTitle6' } };
 *
 * @cfg {Object} [format_h6={ element: 'h6' }]
 * @member CKEDITOR.config
 */
CKEDITOR.config.format_h6 = { element: 'h6' };
