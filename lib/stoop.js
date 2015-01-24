
function Stoop(){
  var self = this;

  self.apply = function(rootNode, viewModel) {
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
      }
    }

    for(var i = 0; i < node.childNodes.length; i++) {
      parseNode(node.childNodes[i], viewModel);
    }
  }

  function evaluateAttrText(attr, viewModel){
    var value = viewModel[attr.value];
    if (typeof(value) == "function") {
      return value();
    }else {
      return value;
    }
  }
}


var stoop = new Stoop();
