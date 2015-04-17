# Video.js Clarify Annotations

A plugin to display Clarify audio search results for a video. For more information on the Clarify API visit http://clarify.io

## Getting Started

Once you've added the plugin script and css file to your page, you can use it with any video:

```
#!html

<link href="videojs-clarify-annotations.css" rel="stylesheet">

<script src="video.js"></script>
<script src="videojs-clarify-annotations.js"></script>
<script>
  videojs('video').clarifyAnnotations(myResults, 0, {showButtons: true});
</script>
```

There's a working example of the plugin in [example.html](example.html) you can check out if you're having trouble. See `grunt connect` below.

## Usage with Brightcove

This plugin can be used with the Brightcove player, either by specifying the plugin on the HTML page or configuring a custom player in the Brightcove studio. For styling, include the file `videojs-clarify-annotations-brightcove.css` instead of `videojs-clarify-annotations.css`.

The following is an example using a Brightcove player with Brightcove hosted video.

```
<!doctype html>
<html>

  <head>
    <meta charset="UTF-8">
    <title>Test Player</title>
    <style>
      .video-js {
      height: 344px;
      width: 610px;
      }
    </style>
    <link href="lib/videojs-clarify-annotations-brightcove.css" rel="stylesheet">
  </head>

  <body>

    <div>
      <video id="myPlayerID"
         data-account="_BRIGHTCOVE_ACCOUNT_ID_"
         data-player="default"
         data-embed="default"
         data-video-id="_BRIGHTCOVE_VIDEO_ID_"

         class="video-js" controls></video>
    </div>

    <script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
    <script src="http://players.brightcove.net/_BRIGHTCOVE_ACCOUNT_ID_/default_default/index.min.js"></script>
    <script src="lib/videojs-clarify-annotations.js"></script>

    <script type="text/javascript">

      videojs("myPlayerID", {
         plugins: {
            clarifyAnnotations: {
              showButtons: true
            }
         }
      }).ready(function() {

         var myPlayer = this;

         $.getJSON('example_search_results.json', function (results) {
             var clarifyAnnotations = myPlayer.clarifyAnnotations(results, 0);
         });
      });

    </script>

</body>
```

## Building
This plugin uses grunt as a task manager, in order to use grunt you will need to have Node[http://nodejs.org] installed. Then from the base directory run npm install to download all components for the project. You may be required to run this as root depending on how your setup is.


```
#!bash

# npm install
```


#### grunt
The default grunt task will build, minify and uglify the plugin and place it in the /dist directory, you can run the task using:


```
#!bash

# grunt
```


#### grunt connect
To test the plugin you can run the built-in server then access through a local browser at http://localhost:8000. The example will be at http://localhost:8000/example.html


```
#!bash

# grunt connect
```

## Installation

After building, copy the files from the `dist` folder to your webserver.

## Documentation

### Functions

#### clarifyAnnotations

#####`clarifyAnnotations(searchResults, itemIndex, options)`

`clarifyAnnotations` is the initializer for the plugin and returns the plugin instance. It can be called multiple times with different search results.

- `searchResults` is a Clarify API search response. Optional. If not specified, results are not changed in the plugin.

- `itemIndex` is the index of the item in the `item_results` array. Optional. Default is 0.

- `options` is an object containing the plugin options. Optional.

### Plugin Options

You may pass in an options object to the plugin upon initialization. This
object may contain any of the following properties:

#### showButton
Type: `boolean`
Default: true

Renders the skip to notation buttons

#### showActive
Type: `boolean`
Default: true

Triggers an active class on notation when the current playback time overlaps.

#### audioOffset
Type: `float`
Default: 0.6

An offset time when skipping to notations, this allows the playback to be right before the actual search result time.

## License

The MIT License. See `LICENSE` file.


## Release History

 - 0.1.0: Initial release
