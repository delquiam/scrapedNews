$("#scrape").click(function(){
    $.ajax({
        url: "/scrape",
        method: "GET"
      }).done(function(result) {
        // alert("Scrape success!");
      });
  });

