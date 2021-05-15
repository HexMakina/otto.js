"use strict";
// IE >= 9
var dev_mode = true;

function vanilla_compatible_browser(){
  if(document.querySelectorAll !== undefined) //using querySelectorAll, partial support in IE8 is due to being limited to CSS 2.1 selectors and a small subset of CSS 3 selectors, opera 30,
    if(document.insertBefore !== undefined)
      if(document.addEventListener !== undefined || document.attachEvent !== undefined)
        if(document.execCommand !== undefined) // not supported in IE8 and earlier
          if(typeof eval !== undefined)
            return true;
  return false;
}

var model = {
  
  by_id: function(dom_id)
  {
    return document.getElementById(dom_id);
  },

  /*  @selector: CSS 2.1 compliant queries
      @context:  limit search to a node and its children
      returns: 	NodeList on success, thow exception on error */
  get: function(selector, context) 
  {
    var res = (context || document).querySelectorAll(selector)
    // console.log("model.get: "+selector+' #'+res.length);
    return res;
  },

  create: function(elt_type, content, attributes)
  {
    //Allows to create a Elt, with text content and misc HTML attributes
    //returns the DOM Element
    var n = document.createElement(elt_type);
    n.appendChild(document.createTextNode(content));
    for(var key in attributes){
      n.setAttribute(key, attributes[key]);
    }
    return n;
  },

  remove: function(id)
  {
      console.log(id);
  },
  
  map: function(node_selector, action, options)
  {
    /*
     * options:
     *  'context' -> set a DOM elt as root to limit selection to elt's childNodes
     *  'handler' -> the handler of the action
     */
    // console.log('model.map(' + action + ') on ('+ node_selector + ')');

    options=(options || {});

    var nodes = model.get(node_selector, options['context']);
    
    if(nodes.length<=0){
      console.info('model.map::nodes.length<=0 for ' +node_selector);
      return null;
    }
    
    //bind node with function call
    for(var i=nodes.length-1; i>=0; --i){
      if(nodes.item(i) !== null){
        var n = nodes.item(i);

        switch(action){
          case 'hide':
          case 'show':
          case 'toggle':          view[action](n);
          break;

          case 'set_attribute':   n.setAttribute(options['attr'], options['attr_val']);
          break;

          default:
            listen.to(n, action, options['handler'], false)
          break;
          
        }
      }
      else
        console.error('model.map::node '+i+' is null, selector is "' + selector + '"');
    }
  },
  
  is: function(node, id){return node.getAttribute('id') == id;},
  has_class: function(node, classname){
      
    return !(node.className.indexOf(classname) == -1);
  },
  add_class: function(node_or_nodes, classname){
    if(node_or_nodes ==null)
      return false;

    if(typeof node_or_nodes[Symbol.iterator] !== 'function')
      node_or_nodes=[node_or_nodes];

    node_or_nodes.forEach(function(node){
      if(!model.has_class(node, classname))
        node.className += ' '+classname;
    });
  },
  del_class: function(node_or_nodes, classname){
    if(node_or_nodes==null)
      return false;

    if(typeof node_or_nodes[Symbol.iterator] !== 'function')
      node_or_nodes=[node_or_nodes];

    node_or_nodes.forEach(function(node){
      node.className = node.className.replace(classname, '');
      
    });
    
  },
  swap_class: function(node_or_nodes, has_class, new_class){
    model.del_class(node_or_nodes, has_class);
    model.add_class(node_or_nodes, new_class);
  },
  
  text_content: function(root_node){
    if ('textContent' in document.createTextNode(''))
      return root_node.textContent;

    var childNodes = root_node.childNodes;
    var result = '';

    for (var i=childNodes.length; i>0; --i) 
    {
      if(childNodes[i].nodeType === 3)
        result += childNodes[i].nodeValue;
      else if(childNodes[i].nodeType === 1) 
        result += model.text_content(childNodes[i]);
    }

    return result;
  },
};

var listen = {
  to: function(node, action, handler, useCapture)
  {
    if(null == node)
    {
      console.error('listen.to ' + action + ' on null node');
      return;
    }
    // console.log('listen.to ' + action + ' n:' + node.getAttribute('id'));
    // console.log(handler);
    if(action == null)
      ;
    else if(action.indexOf('on_') == -1)
      ;
      // console.error('listen.to::switch default fncall (action:'+ action +')');
    else
      node.addEventListener(listen.trans_action(action), handler, (useCapture||false) == true);
  },

  not: function(node, action, handler, useCapture)
  {
    node.removeEventListener(listen.trans_action(action), handler, (useCapture||false) == true);
  },

  trans_action: function(action)
  {
    switch(action)
    {
      case 'on_right_click': action = 'contextmenu'; break;
      case 'on_writing': action = 'keyup'; break;

      default: action = action.substr(3); break;
    }
    return action;
  },
  
  source: function(event, handler){
    var source = event.target;

    while(source !=null && !handler(source))
      source = source.parentElement;
    return source;
  },
  
  wait: function(){
    var timer = 0;
    return function(time_in_milliseconds, callback){
        clearTimeout (timer);
        timer = setTimeout(callback, time_in_milliseconds);
    } 
  }(),
};

var view = {
  
  visible: function(elt){
    var s = window.getComputedStyle(elt).getPropertyValue('display');
    return s != 'none';
  },

  hide: function(node_or_nodes){ // only hides visible() elements
    
    if(node_or_nodes instanceof NodeList)
      for(var i=node_or_nodes.length; i>=0; --i)
        view.hide(node_or_nodes.item(i));
    else if(node_or_nodes != null)
      node_or_nodes.style.display = 'none';
  },

  show: function(elt, display_style){
    elt.style.display = (display_style || 'block')
  },
  
  resize: function(elt, max_rows = 15){
    elt.style.height = (elt.scrollHeight+22)+'px';
  },
  
  toggle: function(elt){
    view.visible(elt) ? view.hide(elt) : view.show(elt);
  },

  get_topleft_coord: function(elem) {

      var box = elem.getBoundingClientRect(); // Get the enclosing rectangle.

      var body = document.body;
      var docElem = document.documentElement;

      // Calculate the page scroll. All browsers except IE<9 support `pageXOffset/pageYOffset`, and in IE when DOCTYPE is set, the scroll can be taken from documentElement(<html>), otherwise from `body` - so we take what we can.
      var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
      var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

      // The document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
      var clientTop = docElem.clientTop || body.clientTop || 0
      var clientLeft = docElem.clientLeft || body.clientLeft || 0

      // Add scrolls to window-relative coordinates and substract the shift of `html/body` to get coordinates in the whole document
      var top  = box.top +  scrollTop - clientTop
      var left = box.left + scrollLeft - clientLeft

      return { top: Math.round(top), left: Math.round(left) }
  },

};

var form = {
  resize: function(css_selector){
  	var max_textarea_rows = 15;
    
    var textareas = model.get(css_selector || 'textarea');
    var ta, rows;
    for (var i = 0; i < textareas.length; i++) 
    {
      ta = textareas[i];
      rows = ta.value.split("\n");
  		if(rows.length <= 2)
  		{
  			var chars = ta.value.length;
  			rows = Math.ceil((chars / 60));
  			rows = rows == 0? 1 : rows;
  		}
  		else
  		{
  			rows = rows.length > max_textarea_rows ? max_textarea_rows : rows.length+1;
  		}
      ta.setAttribute("rows", rows);
    }    
  },
  fill: function(selector){
    var nodes = model.get(selector);
    for(var i=nodes.length-1; i>=0; --i){
      if(nodes.item(i) !== null){
        var n = nodes.item(i);
        listen.to(n, 'on_click', function(event){
          var source = listen.source(event,function(event){ return model.has_class(event, 'otto_fill')});
          var filler_target = model.by_id(source.getAttribute('href').substring(1));
          var filler_text = source.innerHTML;
          if(filler_target.value.length == 0)
            filler_target.value = filler_text;
          else
            filler_target.value = filler_target.value + "\n" + filler_text;
          controller.prevent_default(event);
        });
      }
    }
  }
};

var controller = {
  clipboard: function(dom_id)
  {
    var node = model.by_id(dom_id);
    node.select();
    document.execCommand("copy");
  },

  prevent_default: function(event){
    // use on href=# to prevent moving
    // console.log("prevent_default()");
    if(event.preventDefault) event.preventDefault();
    else event.returnValue = false;
  },
  
};

var ajax = {

  get: function(request_url, request_data, callback){
    ajax.request('GET', request_url, request_data, callback);
  },
  
  set: function(request_url, request_data, callback){
    ajax.request('POST', request_url, request_data, callback);
  },
  
  request: function(request_method, request_url, request_data, callback){
    // console.log('otto.ajax('+request_method+', '+request_url+')');
    // console.log(request_data);
    var http_request = window.XMLHttpRequest? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    http_request.open(request_method, request_url, true);
    
    if(typeof request_data === 'string'){
      http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http_request.send(request_data);
    }
    else if(typeof request_data === 'object')
    {
      var serialized_data = '';
      var object_keys = Object.keys(request_data);
      for (var i = 0; i < object_keys.length; i++)
      {
        var key = object_keys[i];
        if(serialized_data.length!=0)
          serialized_data+='&';
        serialized_data += key + "=" + encodeURIComponent(request_data[key]);
      }
      serialized_data += '&ajax=yes';

      return this.request(request_method, request_url, serialized_data, callback);
    }
    else
      http_request.send(null);

    http_request.onreadystatechange = function(){
      try {
        if (http_request.readyState === XMLHttpRequest.DONE) {
          if (http_request.status === 200) {
            if(typeof callback !== 'undefined' && callback !== null)
              return callback(http_request.responseText);
            else 
              return http_request.responseText;
          }
          else console.error('FAILURE: http_request.status ' + http_request.status);
        }
      }
      catch(e) {
        console.error('FAILURE: exception ' + e);
      }
      return null;
    };
  },

  ajax_form: function(form_id, callback){
    console.log("ajaxify_form()");

    var form = document.getElementById(form_id);

    var elts = form.elements;
    var serialized_data = '';
    
    for (var i = 0; i < elts.length; i++)
    {
      var elt = elts.item(i);
      if(elt.tagName == 'TEXTAREA' || (elt.tagName == 'INPUT' && elt.type != 'submit')){
        console.log(elt.type + ':' + elt.name + ':'+elt.value);
        if(serialized_data.length!=0)
          serialized_data+='&';
        serialized_data += elt.name + "=" + encodeURIComponent(elt.value);
      }
    }
    serialized_data += '&ajax=yes';

    console.log("ajaxify_form::serialized_data:"+serialized_data);

    this.request(form.getAttribute('method'), form.getAttribute('action'), serialized_data, callback);
    
  },

};
