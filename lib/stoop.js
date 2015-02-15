
function Stoop(){
  var self = this;

  var originalRoot = null;
  var originalViewModel = null;

  self.apply = function(rootNode, viewModel) {
    if (originalRoot == null){
      originalRoot = rootNode;
      originalViewModel = viewModel;
    }

    if (typeof viewModel != 'string') {
      if (viewModel.observer) {
        Object.unobserve(viewModel, viewModel.observer);
      }
      viewModel.observer = function(changes){
        //parseNode(rootNode, viewModel);
		    parseNode(originalRoot, originalViewModel);
      };
      Object.observe(viewModel, viewModel.observer);
    }

    parseNode(rootNode, viewModel);
  };

  function parseNode(node, viewModel) {
	if (node.nodeType == 3 && (node.textContent.indexOf('|||') == 0 || node.stoopTextBinding)) {
      node.stoopTextBinding = node.stoopTextBinding || node.textContent.replace('|||', '');
      node.textContent = evaluateAttrText(node.stoopTextBinding, viewModel);
      return;
    }
    if (node.nodeType != 1) {
      return;
    }

    var skipChildren = false;
    for(var i = 0; i < node.attributes.length; i++){
      var attr = node.attributes[i];
      for(var handlerIdx = 0; handlerIdx < bindingHandlers.length; handlerIdx++){
        if (bindingHandlers[handlerIdx].match(attr)) {
          skipChildren |= bindingHandlers[handlerIdx].handle(node, viewModel, attr);
        }
      }
    }
    if (skipChildren) return;
    for(var i = 0; i < node.childNodes.length; i++){
      parseNode(node.childNodes[i], viewModel);
    }
  }

  var bindingHandlers = [
    {
      match : function(attr) { return attr.name == 'text'; },
      handle : function(node, viewModel, attr) {
        node.innerHTML = evaluateAttrText(attr.value, viewModel);
      }
    },{
      match : function(attr) { return attr.name == 'show'; },
      handle : function(node, viewModel, attr) {
        node.style.display =  evaluateAttrBool(attr.value, viewModel) ? '' : 'none';
      }
    },{
      match : function(attr) { return attr.name == 'val'; },
      handle : function(node, viewModel, attr) {
        node.onblur = function() {
          viewModel[attr.value] = node.value;
        };
        node.value = evaluateAttrText(attr.value, viewModel);
      }
    },{
      match : function(attr) { return attr.name == 'keypress'; },
      handle : function(node, viewModel, attr) {
        node.onkeypress = function(event) {
          var fun = evaluateAttrFunction(attr.value, viewModel);
          var result = fun(event);
          if (typeof(result) !== 'undefined' && !result){
            event.stopPropagation();
          }
        };
      }
    },{
      match : function(attr) { return attr.name == 'keydown'; },
      handle : function(node, viewModel, attr) {
        node.onkeydown = function(event) {
          var fun = evaluateAttrFunction(attr.value, viewModel);
          var result = fun(event);
          if (typeof(result) !== 'undefined' && !result){
            event.stopPropagation();
          }
        };
      }
    },{
      match : function(attr) { return attr.name == 'repeat'; },
      handle : function(node, viewModel, attr) {
        if (!node.originalInnerHtml) {
          node.originalInnerHtml = node.innerHTML;
        }
        node.innerHTML = '';
        var arrayValues = evaluateAttrArr(attr.value, viewModel);
        if (arrayValues.observer) {
          Array.unobserve(arrayValues, arrayValues.observer);
        }
        arrayValues.observer = function(changes){
          parseNode(originalRoot, originalViewModel);
        };
        Array.observe(arrayValues, arrayValues.observer);
        for(var j = 0; j < arrayValues.length; j++){
          node.innerHTML += node.originalInnerHtml;
        }
        var eleNodeCount = 0;
        for(var j = 0; j < node.childNodes.length; j++){
          if (node.childNodes[j].nodeType != 1) continue;
          self.apply(node.childNodes[j], arrayValues[eleNodeCount++]);
        }
        return true;
      }
    },{
      match : function(attr) { return attr.name.indexOf('attr-') == 0; },
      handle : function(node, viewModel, attr) {
        var attrValue = evaluateAttrText(attr.value, viewModel);
        node.setAttribute(attr.name.split('-')[1], attrValue);
      }
    },{
      match : function(attr) { return attr.name == 'css'; },
      handle : function(node, viewModel, attr) {
        var cssDescriptor = evaluateAttrObject(attr.value);
        for(var cssClass in cssDescriptor){
          var cssVal = cssDescriptor[cssClass];
          if (evaluateAttrBool(cssVal, viewModel)){
            node.classList.add(cssClass);
          } else {
            node.classList.remove(cssClass);
          }
        }
      }
    },{
      match : function(attr){ return attr.name == 'click'; },
      handle : function(node, viewModel, attr){
        if (attr.value in viewModel) {
          node.onclick = viewModel[attr.value];
        } else {
          node.onclick = eval('__stoop_onclick_function__=' + attr.value);
        }
      }
    },{
      match : function(attr){ return attr.name == 'focus'; },
      handle : function(node, viewModel, attr){
        var result = evaluateAttrBool(attr.value, viewModel);
        if (node.wasGivenFocus ^ result){
          if (result){
            node.focus();
          } else {
            node.blur();
          }
        }
        node.wasGivenFocus = result;
      }
    },{
      match : function(attr){ return attr.name == 'submit'; },
      handle : function(node, viewModel, attr){
        if (attr.value in viewModel) {
          node.onsubmit = viewModel[attr.value];
        } else {
          node.onsubmit = eval('__stoop_onsubmit_function__=' + attr.value);
        }
      }
    }
  ];

  function evaluateAttrText(attrText, viewModel){
    if (attrText == '$$') {
      return viewModel;
    }
    var value = undefined;
    if (attrText in viewModel) {
      value = viewModel[attrText];
    } else {
      value = attrText;
    }

    if (typeof(value) == "function") {
      return value();
    }else {
      return value;
    }
  }

  function evaluateAttrFunction(attrText, viewModel){
    if (attrText == '$$') {
      return viewModel;
    }
    var value = undefined;
    if (attrText in viewModel) {
      value = viewModel[attrText];
    } else {
      value = attrText;
    }

    if (typeof(value) == "function") {
      return value;
    }else {
      throw 'Resolved value wasn\'t a function.';
    }
  }

  function evaluateAttrObject(attrText){
    var result = eval('__deserialized_stoop_variable__=' + attrText);
    return result;
  }

  function evaluateAttrBool(attrText, viewModel){
    var text = evaluateAttrText(attrText, viewModel);
    return text == 'false' ? false : !!text;
  }

  function evaluateAttrArr(attrText, viewModel){
    return viewModel[attrText];
  }
}


var stoop = new Stoop();
