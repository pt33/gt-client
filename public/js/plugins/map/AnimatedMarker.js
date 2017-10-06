L.AnimatedMarker = L.Marker.extend({
  options: {
    // meters
    distance: 200,
    // ms
    interval: 1000,
    // animate on add?
    autoStart: false,
      iconColor: '#9c721d',
    // callback onend
    onEnd: function(){},
      onMove: function(){},
    clickable: false,
      lineColor:null,
      polyline:[],
      center:null,
      speed:5000
  },

  initialize: function (latlngs,options) {
        this.setLine(latlngs);
        L.Marker.prototype.initialize.call(this, latlngs[0], options);
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function(latlngs) {
    var i,
        len = latlngs.length,
        chunkedLatLngs = [];
      chunkedLatLngs.push(latlngs[0]);
    for (i=1;i<len;i++) {
      var cur = latlngs[i-1],
          next = latlngs[i],
          dist = cur.distanceTo(next),
          dist1 = 0
          factor = this.options.distance / dist,
          dLat = factor * (next.lat - cur.lat),
          dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
          var check = 0
        while (dist > this.options.distance) {
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          dist = cur.distanceTo(next);
          if (chunkedLatLngs.length > 1) {
              dist1 = chunkedLatLngs[chunkedLatLngs.length - 1].distanceTo(next)
          }
            if (dist1 < dist) {
               dist = dist1
            } else {
                chunkedLatLngs.push(cur);
            }
          if (check === 0 && i !== (len - 1)) {
              chunkedLatLngs.push(next)
              check = 1
          }
        }
      } else {
          if ((i - 1) !== 0) {
              chunkedLatLngs.push(next);
          }
      }
    }
    chunkedLatLngs.push(latlngs[len-1]);

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Marker.prototype.onAdd.call(this, map);
    this.options.polyline = L.polyline([],
        {
            clickable: false,
            color:this.options.iconColor,
            weight: 5,
            opacity: 0.8,
            lineJoin: 'miter',
            className: 'vco-map-line',
            dashArray: '10, 10',
            fillOpacity: 0.2,
        }).addTo(map);

    if (this.options.autoStart) {
      this.start();
    }
  },

  animate: function() {
    var self = this,
        len = this._latlngs.length
        speed = 10;

    // Normalize the transition speed from vertex to vertex
    if (this._i < len && this._i > 0) {
        speed = Math.ceil(this.options.speed / len)
      // speed = 4000//this._latlngs[this._i-1].distanceTo(this._latlngs[this._i]) / this.options.distance * this.options.interval;
    }


    // Only if CSS3 transitions are supported
    // if (L.DomUtil.TRANSITION) {

      if (this._icon) { this._icon.style[L.DomUtil.TRANSITION] = ('all ' + speed + 'ms linear'); }
      if (this._shadow) { this._shadow.style[L.DomUtil.TRANSITION] = 'all ' + speed + 'ms linear'; }
    // }

    // Move to the next vertex
      self.options.polyline.addLatLng(self._latlngs[self._i])
    this.setLatLng(this._latlngs[this._i]);
      // this.options.polyline.addLatLng(this._latlngs[this._i]);
    this._i++;
    // Queue up the animation to the next next vertex

    this._tid = setTimeout(function(){
      if (self._i === len) {
        self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
      } else {
          self.options.onMove.apply(self, Array.prototype.slice.call(arguments));
        self.animate();
      }
    }, speed);
  },

  // Start the animation
  start: function() {
    this.animate();
  },

  // Stop the animation in place
  stop: function() {
    if (this._tid) {
      clearTimeout(this._tid);
    }
  },
  setLine: function(latlngs){
    // if (L.DomUtil.TRANSITION) {
    //   // No need to to check up the line if we can animate using CSS3
    //   this._latlngs = latlngs;
    // } else {
      // Chunk up the lines into options.distance bits

      var cur = latlngs[0],
          next = latlngs[latlngs.length - 1],
          dist = cur.distanceTo(next)

      var minDistance = 10000
      var maxDistance = 50000

      var minSpeed = 10
      var maxSpeed = 20


      var tmp1 = Math.ceil(dist / minDistance)
      var tmp2 = Math.ceil(dist / maxDistance)
      var distance
      if (tmp1 < minSpeed) {
          speed = minSpeed
      } else if (tmp1 <= maxSpeed && tmp1 >= minSpeed) {
          speed = tmp1
      } else if (tmp1 > maxSpeed && tmp2 < minSpeed){
          speed = minSpeed
      } else if (tmp1 > maxSpeed && tmp2 <= maxSpeed && tmp2 >= minSpeed){
          speed = tmp2
      } else {
          speed = maxSpeed
      }

      distance = dist / speed;
      this.options.distance = distance
      this.options.speed = speed * 1000
      this._latlngs = this._chunk(latlngs);
    // }
      this._i = 0;
  }
});

L.animatedMarker = function (latlngs, options) {
  return new L.AnimatedMarker(latlngs, options);
};
