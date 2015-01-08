
var source = ace.edit("source");
    source.setTheme("ace/theme/github");
    source.getSession().setMode("ace/mode/javascript");
    source.setHighlightActiveLine(false);

var target = ace.edit("target");
    target.setTheme("ace/theme/github");
    target.getSession().setMode("ace/mode/javascript");
    target.setHighlightActiveLine(false);

var Range = ace.require('ace/range').Range
var event = ace.require("ace/lib/event");

var compiler = window.compiler;

var errors = $('#errors');
var compile = $('#compile');
var howto = $('#howto');
var howto_popup = $('#howto-popup');

var URL = 'labels/';

howto.click(function() {howto_popup.toggle()});

function toRange(loc) {
  return new Range(
    loc.start.line - 1,
    loc.start.column,
    loc.end.line - 1,
    loc.end.column
  );
}

function getIdString(id) {
  if (id && id.type === 'Identifier') {
    return id.name;
  }

  if (id && id.type === 'MemberExpression' && !id.computed) {

    var object = getIdString(id.object);
    var property = getIdString(id.property);
    if (object && property)
      return  object + '.' + property; 
  }

  return id
}

function updatePopups() {
    setTimeout(function() {
      
      var markers = source.getSession().getMarkers(true);

      $('.due-marker').each(function(i, markerElm) {

        var index = $(markerElm).attr('class').split(' ').reduce(function(index, clazz) {
          var data = clazz.split('-');
          if (data[0] === 'id')
            return data[1];

          return index;
        }, 0);

        var marker = markers[index].marker;

        $(markerElm).append(toPopup({
          accuracy: marker.accuracy * 100,
          count: marker.count,
          status: marker.isRupturePoint,
          crowdStatus: marker.crowdGuess
        }));
      })
    }, 10);
}

function toPopup(popupInfos) {
  return [
    '<div class=\'due-popup\'>',
    '<span class=\'status\'>',
    (popupInfos.status ? 'Asynchronous' : 'Synchronous'),
    '</span><br/>',
    '<span class=\'crowd ' + (popupInfos.crowdStatus ? 'async' : 'sync') + '\'>',
    (popupInfos.crowdStatus ? 'async' : 'sync'),
    '</span> ',
    '<span class=\'accuracy\'>(',
    popupInfos.accuracy,
    '%</span> / ',
    '<span class=\'count\'>',
    popupInfos.count,
    ')</span>',
    '</div>'
  ].join('');
}

function MarkerAtPosition(loc) {
  return _markers.filter(function(marker) {
    return (loc.row + 1 >= marker.loc.start.line
        &&  loc.column >= marker.loc.start.column
        &&  loc.row + 1 <= marker.loc.end.line
        &&  loc.column <= marker.loc.end.column)
  })[0];
}

var _markers = [];

compileSource();
source.getSession().on('change', compileSource);

source.on("click", function(e){
  var marker = MarkerAtPosition(source.getCursorPosition())

  if (marker) {

    if (marker.marker.clazz.indexOf('due-deferredCall') !== -1) {
      marker.isRupturePoint = true;
      marker.marker.clazz = marker.marker.clazz.replace('due-deferredCall', 'due-rupturePoint');
    } else if (marker.marker.clazz.indexOf('due-rupturePoint') !== -1) {
      marker.isRupturePoint = false;
      marker.marker.clazz = marker.marker.clazz.replace('due-rupturePoint', 'due-deferredCall');
    }

    source.renderer.updateFrontMarkers();
    updatePopups();
  }

  return false
})


function compileSource(e) {
  try {
    compiler(source.getValue(), filterRP, updateCode);
  } catch (e) {
    displayError(e);
  }
}

function filterRP(err, potentialRP, callback) {

  console.log(potentialRP);

  var session = source.getSession();
  var renderer = source.renderer;
  getLabels(potentialRP);

  function getLabels(potentialRP) {

    var labels = potentialRP.reduce(function(labels, rp) {
      var id = getIdString(rp.parent.callee);

      if (id) {
        labels[id] = labels[id] || [];
        labels[id].push(rp);
      }

      return labels;
    }, {})

    $.ajax({
      type: "GET",
      url: URL + Object.keys(labels).join(','),
      // crossDomain: true,
      success: getMarkers,
      dataType: 'JSON'
    });

    function getMarkers(statusRP) {
      var markers = Object.keys(labels).reduce(function(markers, label) {
        if (statusRP[label]) {
          var sync = statusRP[label].sync;
          var async = statusRP[label].async;
        } else {
          var sync = 0;
          var async = 0;
        }

        function toMarker(rp, label) {
          return {
            label : label,
            rp : rp,
            loc : rp.parent.callee.loc,
            isRupturePoint : (async > sync),
            crowdGuess : (async > sync),
            count : sync + async,
            accuracy : Math.max(async, sync) / (async + sync)
          }
        }

        labels[label].forEach(function(rp) {
          markers.push(toMarker(rp, label));
        })
        return markers;
      }, [])

      updateMarkers(markers);
    }
  }

  function updateMarkers(markers) {
    var clicked = _markers.reduce(function(clicked, marker) {
      session.removeMarker(marker.marker.id);

      if (marker.crowdGuess !== marker.isRupturePoint) {
        clicked.push(marker.label);
      }

      return clicked;
    }, [])

    _markers = markers;

    markers.forEach(function(marker) {
      var clazz = (marker.isRupturePoint ? "due-rupturePoint" : "due-deferredCall");
      marker.marker = session.addMarker(toRange(marker.loc), 'due-marker ' + clazz, undefined, true);
      // marker.marker = session.addMarker(toRange(marker.loc), 'due-marker ' + clazz + ' count-' + marker.count + ' accuracy-' + Math.floor(marker.accuracy * 1000), undefined, true);
    });

    // In the following, and very confusing lines :
    // _markers is the array of rupture point markers from the compiler
    // markers is the array of markers from ace editor
    // we link the two together via the property marker.

    var markers = session.getMarkers(true);

    _markers.forEach(function(_marker) {
      markers[_marker.marker].clazz += ' id-' + _marker.marker;
      markers[_marker.marker].marker = _marker;
      _marker.marker = markers[_marker.marker];
    })

    renderer.updateFrontMarkers();
    updatePopups();

    compile.off('click');
    compile.click(compileListener);
  }

  function compileListener() {
    
    var rps = _markers.reduce(function(rps, marker) {
      if (marker.isRupturePoint)
        rps.push(marker.rp.parent);

      return rps;
    }, [])


    var labels = _markers.reduce(function(labels, marker) {

      if (!labels[marker.label]
      ||  labels[marker.label].isRupturePoint === marker.isRupturePoint) {
        labels[marker.label] = {isRupturePoint: marker.isRupturePoint};
      } else {
        delete labels[marker.label];
      }

      return labels;
    }, {});

    $.post(URL, JSON.stringify(labels))
    .fail(function(e) { console.log("error", e.statusCode()); });

    try {
      callback(null, rps)
    } catch (e) {
      displayError(e);
    }
  }
}

function updateCode(err, code) {
  if (err)
    displayError(err)
  else
    target.setValue(code, -1);

  // setTimeout(compileSource,0);
}

function displayError(err) {
  console.error(err);

  var error = $('<div class="error"><div class="close">✖</div><span class="message"></span></div>');

  $(error).find('.message').text(err);
  $(error).find('.close').click(function() {
    error.remove();
  })

  errors.append(error);
}

// function test() {
//   console.log('test');
//   console.log(' ------ ');

//   // editor.getSession().setAnnotations([{
//   //   row: 0,
//   //   column: 1,
//   //   text: "Strange error",
//   //   type: "information" // also warning and information
//   // }]);


//   // editor.getSession().setAnnotations([{
//   //                 row: editorcursor.row,
//   //                 column: editorcursor.column,
//   //                 text: "Strange error",
//   //                 type: "info"
//   //               }]);

//   // var markerId = editor.getSession().renderer.addMarker(new Range(1, 10, 1, 15), "warning", "text");

  

//   // console.log(session);

//   console.log(' ------ ');
// }

// compile.click(test)
// compile.click(compileSource)

// var code = source.toString();

// compiler(code, function(err, res) {
//     console.log(err, res);
// })

  
// console.log(window.__compiler);
