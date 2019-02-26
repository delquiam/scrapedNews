//Scrape button
$("#scrape").click(function () {
    $.ajax({
        url: "/scrape",
        method: "POST"
    }).done(function (data) {
        console.log(data);
        location.reload();
    });
});


//Save Article button
$(".save").on("click", function () {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "PUT",
        url: "/articles/saved/" + thisId
    }).done(function (data) {
        console.log(data);
        window.location = "/"
    })
});

// Delete Article button
$(".delete").on("click", function () {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + thisId
    }).done(function (data) {
        window.location = "/saved"
    })
});
// ---------------------------------------------------------------------------------------
//Save Note button
$(".saveNote").on("click", function () {
    var thisId = $(this).attr("data-id");
    if (!$("#noteText" + thisId).val()) {
        alert("Please enter a note about the article")
    } else {
        $.ajax({
            method: "POST",
            url: "/notes/saved/" + thisId,
            data: {
                text: $("#noteText" + thisId).val()
            }
        }).done(function (data) {
            // $('#noteText').text( $('.previousNotes').val() );
            // Log the response
            console.log(data);
            // Empty the notes section
            $("#noteText" + thisId).val("");
            $(".modalNote").modal("hide");
            window.location = "/saved"
        });
    }
});

// Delete Note button
$(".deleteNote").on("click", function () {
    var noteId = $(this).attr("data-note-id");
    var articleId = $(this).attr("data-article-id");
    $.ajax({
        method: "DELETE",
        url: "/notes/delete/" + noteId
    }).done(function (data) {
        console.log(data);
        $("#" + noteId).remove();
        $(".modalNote").modal("hide");
        window.location = "/saved"
    })
});