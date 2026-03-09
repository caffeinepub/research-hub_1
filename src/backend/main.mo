import OutCall "http-outcalls/outcall";
import Text "mo:core/Text";
import Blob "mo:core/Blob";

actor {
  // Transform callback for HTTP responses (does nothing).
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func makeGetRequest(url : Text) : async Text {
    await OutCall.httpGetRequest(url, [], transform);
  };

  // Search Wikipedia articles.
  func searchWikipediaArticles(searchText : Text) : async Text {
    let url = "https://en.wikipedia.org/w/api.php?" # "action=query&format=json&prop=pageimages%7Cextracts&generator=search&formatversion=2&" # "piprop=thumbnail&pithumbsize=250&pilimit=50&exintro=true&explaintext=true&exsentences=1&exlimit=20&gsrsearch=" # searchText;
    await makeGetRequest(url);
  };

  // Search Wikimedia Commons images.
  func searchWikimediaImages(searchText : Text) : async Text {
    let url = "https://commons.wikimedia.org/w/api.php?" # "action=query&format=json&generator=search&gsrsearch=" # searchText # "&gsrlimit=30&prop=imageinfo&iiprop=url";
        await makeGetRequest(url);
  };

  // Search Wikimedia Commons videos.
  func searchWikimediaVideos(searchText : Text) : async Text {
    let url = "https://commons.wikimedia.org/w/api.php?" # "action=query&format=json&generator=search&gsrsearch=" # searchText # "+incategory%3A%22Videos%22" # "&gsrlimit=20&gsrnamespace=6&prop=imageinfo&iilimit=15&iiprop=url|mediatype";
    await makeGetRequest(url);
  };
};
