mergeInto(LibraryManager.library, {
  GoToPage: function (urlPtr) {
    var url = UTF8ToString(urlPtr);
    window.location.href = url;
  }
});