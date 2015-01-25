
function Stoop(){
  var self = this;

  self.apply = function(rootNode, viewModel) {
    if (typeof viewModel != 'string') {
      if (viewModel.observer) {
        Object.unobserve(viewModel, viewModel.observer);
      }
      viewModel.observer = function(changes){
        parseNode(rootNode, viewModel);
      };
      Object.observe(viewModel, viewModel.observer);
    }
    parseNode(rootNode, viewModel);
  };

  function parseNode(node, viewModel){
    if (node.nodeType != 1) {
      return;
    }

    for(var i = 0; i < node.attributes.length; i++){
      var attr = node.attributes[i];
      if (attr.name == 'text') {
        node.innerHTML = evaluateAttrText(attr, viewModel);
      } else if (attr.name == 'show') {
        node.style.display =  evaluateAttrBool(attr, viewModel) ? '' : 'none';
      } else if (attr.name == 'val') {
        node.onkeyup = function() {
          viewModel[attr.value] = node.value;
        };
        node.value = evaluateAttrText(attr, viewModel);
      } else if (attr.name == 'repeat') {
        if (!node.originalInnerHtml) {
          node.originalInnerHtml = node.innerHTML;
        }
        node.innerHTML = '';
        var arrayValues = evaluateAttrArr(attr, viewModel);
        if (arrayValues.observer) {
          Array.unobserve(arrayValues, arrayValues.observer);
        }
        arrayValues.observer = function(changes){
          parseNode(node, viewModel);
        };
        Array.observe(arrayValues, arrayValues.observer);
        for(var j = 0; j < arrayValues.length; j++){
          node.innerHTML += node.originalInnerHtml;
        }
        var eleNodeCount = 0;
        for(var j = 0; j < node.childNodes.length; j++){
          if (node.childNodes[j].nodeType != 1) continue;
          parseNode(node.childNodes[j], arrayValues[eleNodeCount++]);
        }
        return;
      }
    }

    for(var i = 0; i < node.childNodes.length; i++) {
      parseNode(node.childNodes[i], viewModel);
    }
  }

  function evaluateAttrText(attr, viewModel){
    if (attr.value == '$$') {
      return viewModel;
    }
    var value = undefined;
    if (attr.value in viewModel) {
      value = viewModel[attr.value];
    } else {
      value = attr.value;
    }

    if (typeof(value) == "function") {
      return value();
    }else {
      return value;
    }
  }

  function evaluateAttrBool(attr, viewModel){
    var text = evaluateAttrText(attr, viewModel);
    return text == 'false' ? false : !!text;
  }

  function evaluateAttrArr(attr, viewModel){
    return viewModel[attr.value];
  }
}


var stoop = new Stoop();
