
function Stoop(){
  var self = this;

  self.apply = function(rootNode, viewModel) {
    Object.observe(viewModel, function(changes){
      parseNode(rootNode, viewModel);
    });

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
      } else if (attr.name ='val') {
        node.onchange = function() {
          viewModel[attr.value] = node.value;
        };
        node.value = evaluateAttrText(attr, viewModel);
      }
    }

    for(var i = 0; i < node.childNodes.length; i++) {
      parseNode(node.childNodes[i], viewModel);
    }
  }

  function evaluateAttrText(attr, viewModel){
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
}


var stoop = new Stoop();
