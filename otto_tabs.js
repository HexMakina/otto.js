"use strict";

function tabulate()
{
  var nodes = model.get('.ox-tabs-container');

  for(var i=nodes.length-1; i>=0; --i){
    var tab_container = nodes.item(i);
    var tab_links = model.get('.ox-tabs-link', tab_container);

    for(var j=tab_links.length-1; j>=0; --j){
      var tab_link = tab_links.item(j);

      listen.to(tab_link, 'on_click', function(event){
        var link_clicked = listen.source(event, function(event){return model.has_class(event, 'ox-tabs-link')});
        var tab_content = model.by_id(link_clicked.getAttribute('href').substring(1)); // substring removes the #
        var tab_container = tab_content.parentNode;
        var all_tabs = model.get('.ox-tabs-content', tab_container);

        view.hide(all_tabs); // hide all tabs

        if(model.has_class(link_clicked, 'w3-primary')) // clicking the active tab
        {
          model.swap_class(link_clicked, 'w3-primary','w3-secondary'); // sets current link in secondary mode
        }
        else
        {
          model.swap_class(model.get('.ox-tabs-link', tab_container), 'w3-primary','w3-secondary'); // sets all links in secondary monde
          model.swap_class(link_clicked,'w3-secondary', 'w3-primary'); // sets current link in primary mode
          view.show(tab_content); // show target tab
        }
        controller.prevent_default(event);
      });
    }
  }
}
