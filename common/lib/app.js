(function (){

  var root = this;

  var bgApp = root.bgApp = {};

  bgApp.notificationIds = {};

  var localStorage = root.localStorage;

  bgApp.del = function (/*keys*/){
    for ( var i = 0; i < arguments.length; i++ ) {
      delete localStorage[arguments[i]];
    }
  };

  bgApp.get = function (key){
    return key in localStorage ?
      JSON.parse(localStorage[key]) :
      undefined;
  };

  bgApp.set = function (key, val){
    localStorage[key] = JSON.stringify(val);
  };

  bgApp.getOSName = function (){
    var OSName = "Unknown OS";
    if ( navigator.appVersion.indexOf("Win") != -1 ) OSName = "Windows";
    if ( navigator.appVersion.indexOf("Mac") != -1 ) OSName = "MacOS";
    if ( navigator.appVersion.indexOf("X11") != -1 ) OSName = "UNIX";
    if ( navigator.appVersion.indexOf("Linux") != -1 ) OSName = "Linux";
    return OSName;
  };

  bgApp.growlNotificationsSupported = function (){
    return utils.notifications.growlNotificationsSupported();
  };

  bgApp.richNotificationsSupported = function (){
    return utils.notifications.richNotificationsSupported();
  };

  bgApp.bindNotificationListeners = function (){

    if ( bgApp.richNotificationsSupported() ) {

      chrome.notifications.onClicked.addListener(function (notificationId){
        var stream = bgApp.notificationIds[notificationId];
        if ( stream ) {
          stream.openStream();
        }
        chrome.notifications.clear(notificationId, function (){

        });
      });

      chrome.notifications.onClosed.addListener(function (notificationId, byUser){
        delete bgApp.notificationIds[notificationId];
      });
    }
  };

  bgApp.sendNotification = function (streamList){
    var displayCount = 5;
    var opt;
    var defaultIcon = utils.runtime.getURL("common/icons/64_2.png");
    var streamsToShow = streamList.slice(0, displayCount);
    var isSingle = streamsToShow.length === 1;
    var streamTitles = streamsToShow.map(function (c){
      return c.get("channel").display_name;
    });

    if ( bgApp.growlNotificationsSupported() ) {

      var opts = {
        title  : "Twitch Now",
        text   : streamTitles.join("\n"),
        iconURL: defaultIcon
      }

      if ( streamTitles.length == 1 ) {
        opts.data = streamsToShow[0].getStreamURL();
      }
      utils.notifications.create(opts);
    }

    if ( bgApp.richNotificationsSupported() ) {

      var notificationId = _.uniqueId("TwitchNow.Notification.");

      try {
        if ( isSingle ) {
          opt = {
            type   : "basic",
            title  : streamsToShow[0].get("channel").display_name,
            message: streamsToShow[0].get("game"),
            iconUrl: streamsToShow[0].get("preview")
          }

          bgApp.notificationIds[notificationId] = streamsToShow[0];

        } else {
          opt = {
            type   : "basic",
            title  : "Twitch Now",
            message: streamTitles.join("\n"),
            iconUrl: defaultIcon
          }

        }
        chrome.notifications.create(notificationId, opt, function (){

        });

        setTimeout(function (){
          chrome.notifications.clear(notificationId, function (){
          });
        }, 10000);

      } catch (e) {
        delete bgApp.notificationIds[notificationId];
        console.log("Notification error: ", e);
      }
    }
  };

  bgApp.clearBadge = function (){
    bgApp.setBadge("");
  };

  bgApp.setBadge = function (text){
    text += "";
    text = text === "0" ? "" : text;
    utils.browserAction.setBadgeText({
      text: text
    })
  };

  bgApp.audioSupported = function audioSupported(){
    var saved = audioSupported.val;
    if ( saved !== undefined ) {
      return saved;
    }
    audioSupported.val = true;
    try {
      new Audio();
    } catch (e) {
      audioSupported.val = false;
    }
    return audioSupported.val;
  };

  bgApp.playSound = function (path){
    var sound;

    if ( !/^data:audio/.test(path) ) {
      path = /^http/i.test(path) ? path : utils.runtime.getURL(path);
    }

    sound = new Audio();
    sound.src = path;
    sound.play();
  };

  bgApp.init = function (){
    bgApp.clearBadge();
  };

  var defaultSettings = [
    {
      id   : "windowHeight",
      desc : "__MSG_m62__",
      range: true,
      show : false,
      type : "range",
      tip  : "px",
      min  : 360,
      max  : 590,
      value: 590
    },
    {
      id    : "defaultTab",
      desc  : "__MSG_m66__",
      type  : "select",
      select: true,
      opts  : [
        {id: "following", name: "__MSG_m67__"},
        {id: "browse", name: "__MSG_m68__"},
        {id: "topstreams", name: "__MSG_m69__"}
      ],
      show  : true,
      value : "following"
    },
    {
      id    : "viewSort",
      desc  : "__MSG_m1__",
      type  : "select",
      select: true,
      opts  : [
        {id: "viewers|1", name: "__MSG_m10__"},
        {id: "viewers|-1", name: "__MSG_m11__"},
        {id: "name|1", name: "__MSG_m12__"},
        {id: "name|-1", name: "__MSG_m13__"},
        {id: "game|1", name: "__MSG_m82__"},
        {id: "created_at|-1", name: "__MSG_m14__"}
      ],
      show  : true,
      value : "viewers|-1"
    },
    {
      id   : "themeType",
      desc : "__MSG_m55__",
      type : "radio",
      radio: true,
      opts : [
        {id: "dark", name: "__MSG_m56__"},
        {id: "white", name: "__MSG_m57__"}
      ],
      show : true,
      value: "white"
    },
    {
      id      : "simpleView",
      desc    : "__MSG_m65__",
      checkbox: true,
      type    : "checkbox",
      show    : true,
      value   : false
    },
    {
      id   : "openStreamIn",
      desc : "__MSG_m2__",
      type : "radio",
      radio: true,
      opts : [
        {id: "newlayout", name: "__MSG_m16__"},
        {id: "popout", name: "__MSG_m17__"}
      ],
      show : true,
      value: "newlayout"
    },
    {
      id   : "openChatIn",
      desc : "__MSG_m3__",
      type : "radio",
      radio: true,
      opts : [
        {id: "newwindow", name: "__MSG_m18__"},
        {id: "newtab", name: "__MSG_m19__"}
      ],
      show : true,
      value: "newwindow"
    },
    {
      id      : "showBadge",
      desc    : "__MSG_m4__",
      checkbox: true,
      type    : "checkbox",
      show    : true,
      value   : true
    },
    {
      id      : "showDesktopNotification",
      desc    : "__MSG_m5__",
      checkbox: true,
      type    : "checkbox",
      show    : true,
      value   : true
    },
    {
      id   : "closeNotificationDelay",
      desc : "__MSG_m6__",
      range: true,
      type : "range",
      tip  : "sec",
      min  : 5,
      value: 8,
      max  : 60
    },
    {
      id      : "playNotificationSound",
      desc    : "__MSG_m7__",
      checkbox: true,
      show    : true,
      type    : "checkbox",
      value   : false
    },
    {
      id   : "notificationSound",
      desc : "__MSG_m8__",
      type : "radio",
      radio: true,
      show : true,
      opts : [
        {id: "common/audio/ding.ogg", name: "ding"},
        {id: "common/audio/chime.mp3", name: "chime"},
        {id: "common/audio/click.wav", name: "click"},
        {id: "customsound", name: "__MSG_m76__"}
      ],
      value: "common/audio/ding.ogg"
    },
    {
      id    : "customNotificationSound",
      desc  : "__MSG_m75__",
      button: true,
      show  : true,
      type  : "button",
      value : ""
    },
    {
      id   : "refreshInterval",
      desc : "__MSG_m9__",
      range: true,
      show : true,
      type : "range",
      tip  : "min",
      min  : 1,
      max  : 60,
      value: 5
    }
  ];

  var User = Backbone.Model.extend({
    userpic         : utils.runtime.getURL("common/icons/default_userpic.png"),
    initialize      : function (){
      var self = this;
      this.set({
        "authenticated": twitchApi.isAuthorized(),
        "logo"         : self.userpic,
        "name"         : "Twitchuser"
      });

      twitchApi.on("authorize", function (){
        self.populateUserInfo(function (){
        });
        self.set("authenticated", true);
      });

      twitchApi.on("revoke", function (){
        self.set("authenticated", false);
      });
    },
    populateUserInfo: function (cb){

      var self = this;

      twitchApi.send("user", {}, function (err, res){
        if ( !err ) {
          self.set({
            logo: res.logo || self.userpic,
            name: res.display_name
          })
        }
        cb(err, res);
      });
    },
    login           : function (){
      twitchApi.authorize();
    },
    logout          : function (){
      twitchApi.revoke();
    }
  });

  var Control = Backbone.Model.extend({

    initialize: function (){
      this.setShow();
    },

    setShow: function (){
      var hideControls = {
        chrome : [],
        firefox: [/*"showBadge"*/],
        opera  : []
      }

      var rbrowser = utils.rbrowser;
      var hideIds = hideControls[rbrowser];
      var selfId = this.get("id");
      if ( hideIds && ~hideIds.indexOf(selfId) ) {
        this.set("show", false);
      }
    },

    isValidValue: function (v){
      var type = this.get("type");

      if ( type == "checkbox" ) {
        if ( v === true || v === false ) {
          return true;
        }
        return false;
      }
      else if ( type == "radio" || type == "select" ) {
        var opts = this.get("opts");
        for ( var i = 0; i < opts.length; i++ ) {
          if ( opts[i].id === v ) {
            return true;
          }
        }
        return false;
      }
      else if ( type == "range" ) {
        var min = this.get("min")
          , max = this.get("max")
          ;
        v = parseInt(v, 10);

        if ( !isNaN(v) && v >= min && v <= max ) {
          return true;
        }
        return false;
      }

      return false;
    }
  });

  var Settings = Backbone.Collection.extend({
    model: Control,

    initialize: function (){
      var storedSettings = bgApp.get("settings") || [];

      this.add(defaultSettings);

      this.forEach(function (control){
        var saved = _.find(storedSettings, function (storedControl){
          return storedControl.id === control.get("id");
        });

        if ( saved && saved.hasOwnProperty("value") && control.isValidValue(saved.value) ) {
          control.set("value", saved.value);
        }
      })

      this.saveToStorage();
      this.on("change", this.saveToStorage);
    },

    getNotificationSoundSource: function (){
      var val = this.get("notificationSound").get("value");
      return val == "customsound" ? localStorage["customSound"] : val;
    },

    saveToStorage: function (){
      bgApp.set("settings", this.toJSON());
    }
  });

  var TrackLastErrorMixin = {
    lastErrorMessage: "",
    initialize      : function (){
      //clear last message if update was successfull
      this.on("update", function (){
        this.lastErrorMessage = "";
      })
      this.on("error", function (err){
        console.log("\nNew error = ", err);
        this.lastErrorMessage = err;
        this.trigger("_error", this.lastErrorMessage);
      }.bind(this))
    }
  }

  var TwitchItemModel = Backbone.Model.extend({

    idAttribute: "_id",

    baseUrl: function (){
      return "http://www.twitch.tv";
    }
  });

  var Video = TwitchItemModel.extend();

  var Videos = Backbone.Collection.extend({
    model     : Video,
    updateData: function (){
      twitchApi.send(this.url, this.query(), function (err, res){
        if ( err || !res || !res.videos ) {
          return this.trigger("error", "api");
        }
        if ( res.videos.length == 0 ) {
          return this.trigger("error", "novideo");
        }

        this.reset(res.videos, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  });

  var ChannelVideos = Videos.extend({
    url    : "channelVideos",
    channel: null,
    query  : function (){
      return {
        channel: this.channel,
        limit  : 20
      }
    }
  })

  var GameVideos = Videos.extend({
    url  : "gameVideos",
    game : null,
    query: function (){
      return {
        game : this.game,
        limit: 20
      }
    }
  })

  var Game = Backbone.Model.extend({
    idAttribute: "_id",

    follow: function (cb){
      cb = cb || $.noop;
      var target = this.get("game").name;
      twitchApi.send("gameFollow", {name: target}, function (err, res){
        if ( err ) return cb(err);
        this.trigger("follow", this.attributes);
        cb();
      }.bind(this));
    },

    unfollow: function (cb){
      cb = cb || $.noop;
      var target = this.get("game").name;
      twitchApi.send("gameUnfollow", {name: target}, function (err, res){
        if ( err ) return cb(err);
        this.trigger("unfollow", this);
        cb();
      }.bind(this));
    }
  });

  var Games = Backbone.Collection.extend({

    model: Game,

    findByName: function (gameName){
      return this.find(function (g){
        return g.get("game").name == gameName;
      })
    },

    updateData: function (){
      clearTimeout(this.timeout);
      twitchApi.send("gamesTop", {}, function (err, res){
        this.timeout = setTimeout(this.updateData.bind(this), 5 * 60 * 1000);
        if ( err || !res || !res.top ) {
          return this.trigger("error", "api");
        }
        if ( res.top.length == 0 ) {
          return this.trigger("error", "api");
        }

        res.top.forEach(function (g){
          g._id = g.game._id;
        });
        this.reset(res.top, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  });

  var FollowedGames = Games.extend({
    initialize: function (){
      var self = this;

      twitchApi.on("authorize", function (){
        self.updateData();
      })

      twitchApi.on("revoke", function (){
        self.reset();
      });
    },
    updateData: function (){
      clearTimeout(this.timeout);
      twitchApi.send("followedgames", {}, function (err, res){
        this.timeout = setTimeout(this.updateData.bind(this), 5 * 60 * 1000);
        if ( err ) {
          if ( err.status == 401 ) {
            return this.trigger("error", "auth");
          }
          return this.trigger("error", "api");
        }
        if ( !res || !res.follows ) {
          return this.trigger("error", "api");
        }

        if ( res.follows.length == 0 ) {
          return this.trigger("error", "nofollowedgames");
        }
        res.follows.forEach(function (g){
          g._id = g.game._id;
        });
        this.reset(res.follows, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  })

  var ChannelNotification = Backbone.Model.extend({
    idAttribute    : "_id",
    defaults       : {
      notificationOpts: {
        desktop: true,
        sound  : true
      }
    },
    getProfileUrl  : function (){
      return "http://www.twitch.tv/" + this.get("channel").name + "/profile";
    },
    openProfilePage: function (){
      utils.tabs.create({url: this.getProfileUrl()});
    },
    initialize     : function (){

    }
  });

  var NotificationSettings = Backbone.Collection.extend({
    model: ChannelNotification,

    comparator: function (a){
      return a.get("channel").name;
    },

    initialize            : function (){
      _.extend(this, new Backbone.Memento(this));
      var self = this;

      twitchApi.on("revoke", function (){
        self.reset();
      })
    },
    loadFromStorage       : function (){
      if ( twitchApi.isAuthorized() ) {
        return bgApp.get("notifications_" + twitchApi.userName) || [];
      } else {
        this.trigger("error", "auth");
        return [];
      }
    },
    getChannelNotification: function (cid, type){
      var self = this;

      var channel = _.findWhere(self.loadFromStorage(), {_id: cid});
      if ( channel ) {
        return channel.notificationOpts[type];
      } else {
        return true;
      }
    },
    saveToStorage         : function (){
      if ( twitchApi.isAuthorized() ) {
        var val = this.map(function (v){
          return {
            "_id"             : v.get("_id"),
            "notificationOpts": v.get("notificationOpts")
          }
        });
        bgApp.set("notifications_" + twitchApi.userName, val);


        if ( !settings.get("playNotificationSound").get("value") ) {
          var hasSoundNotifications = _.findIndex(this.models, function (ch){
            return ch.attributes.notificationOpts.sound == true;
          })
          hasSoundNotifications = hasSoundNotifications > -1;

          if ( hasSoundNotifications ) {
            settings.get("playNotificationSound").set("value", true);
          }
        }

      } else {
        this.trigger("error", "auth");
      }
    },
    updateData            : function (){
      var self = this;
      var channels = [];

      function getFollowedChannelsCount(cb){
        twitchApi.send("follows", {offset: 0, limit: 1}, function (err, res){
          if ( err || !res || !res._total ) {
            return cb(err || new Error("No Total channels"));
          }
          return cb(null, parseInt(res._total));
        })
      }

      function getFollowedChannels(count, cb){
        twitchApi.send("follows", {offset: count * 100, limit: 100}, function (err, res){
          if ( err || !res || !res.follows ) {
            return cb(err || new Error("No Total channels"));
          }

          res.follows.forEach(function (c){
            c._id = c.channel._id;
            c.channel.logo = c.channel.logo || "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_50x50.png";
            c.channel.logo = c.channel.logo.replace("300x300", "50x50");
          });
          channels = channels.concat(res.follows);

          return cb(null);
        })
      }

      getFollowedChannelsCount(function (err, count){
        var fns = [];
        var limit = 4;
        var requestCount = Math.ceil(count / 100);

        for ( var i = 0; i < requestCount; i++ ) {
          fns.push(getFollowedChannels.bind(null, i));
        }

        async.parallelLimit(fns, limit, function (err, results){
          if ( err ) {
            return self.trigger("error", "api");
          } else {
            self.reset(channels, {silent: true});
            //merge with stored notification preferences
            self.set(self.loadFromStorage(), {add: false, remove: false, merge: true, silent: true});
            self.trigger("update");
          }
        })
      });
    }
  })

  var Stream = TwitchItemModel.extend({

    defaults: {
      created_at: Date.now()
    },

    initialize: function (){
      var channelName = this.get("channel").name;
      this.set({
          name: channelName
        },
        {silent: true});
    },

    follow: function (cb){
      cb = cb || $.noop;
      var target = this.get("channel").name;
      twitchApi.send("follow", {target: target}, function (err, res){
        if ( err ) return cb(err);
        this.trigger("follow", this.attributes);
        cb();
      }.bind(this));
    },

    unfollow: function (cb){
      cb = cb || $.noop;
      var target = this.get("channel").name;
      twitchApi.send("unfollow", {target: target}, function (err, res){
        if ( err ) return cb(err);
        this.trigger("unfollow", this);
        cb();
      }.bind(this));
    },

    getStreamURL: function (type){
      type = type || settings.get("openStreamIn").get("value");

      var links = {
        newlayout: "/ID",
        popout   : "/ID/popout"
      };

      return this.baseUrl() + links[type].replace(/ID/, this.get("channel").name);
    },

    openStream: function (type){
      var url = this.getStreamURL(type);
      utils.tabs.create({url: url});
    },

    openChat: function (){
      var openIn = settings.get("openChatIn").get("value");
      var href = this.baseUrl() + "/chat/embed?channel=ID&popout_chat=true".replace(/ID/, this.get("channel").name);

      if ( openIn == "newwindow" ) {
        utils.windows.create({url: href, width: 400});
      } else {
        utils.tabs.create({url: href});
      }
    }
  });

  var StreamCollection = Backbone.Collection.extend({

    model: Stream,

    twitchApi: twitchApi,

    initialize: function (){
      this.setComparator();
      settings.get("viewSort").on("change:value", function (){
        this.setComparator();
      }.bind(this));
    },

    setComparator: function (){
      var curSort = settings.get("viewSort").get("value").split("|");
      var prop = curSort[0];
      var reverse = parseInt(curSort[1], 10);

      this.comparator = function (a, b){
        return a.get(prop) > b.get(prop) ? 1 * reverse
          : a.get(prop) < b.get(prop) ? -1 * reverse : 0;
      };
      this.sort();
    }
  });

  var FollowingCollection = StreamCollection.extend({

    model: Stream,

    initialize: function (){
      var self = this;

      setInterval(function (){
        self.notified = [];
      }, 1000 * 60 * 60);

      this.on("unfollow", function (attr){
        self.remove(attr);
      });

      this.on("add update remove reset", function (){
        badge.set("count", this.length);
      });

      this.on("update", function (){
        self.notify();
      });

      this.on("add", function (stream){
        self.addedStreams = [stream.id];
        self.notify();
      })

      twitchApi.on("authorize", function (){
        self.updateData();
      })

      twitchApi.on("revoke", function (){
        self.reset();
      });

      StreamCollection.prototype.initialize.call(this);
    },

    getNewStreams: function (){
      var ids = this.addedStreams;
      return this.filter(function (stream){
        return ~ids.indexOf(stream.get("_id"));
      });
    },

    addedStreams: [],
    notified    : [], //store notified streams id here
    notify      : function (){
      var self = this;

      twitchApi.getUserName(function (){
        //notify about all streams if error happens
        var desktopNotifications = self.getNewStreams()
          .filter(function (stream){
            return notifications.getChannelNotification(stream.get("channel")._id, "desktop")
          })

        var soundNotifications = self.getNewStreams()
          .filter(function (stream){
            return notifications.getChannelNotification(stream.get("channel")._id, "sound")
          })

        if ( desktopNotifications.length && settings.get("showDesktopNotification").get("value") ) {
          bgApp.sendNotification(desktopNotifications);
        }

        if ( soundNotifications.length && settings.get("playNotificationSound").get("value") ) {
          bgApp.playSound(settings.getNotificationSoundSource());
        }
      })

    },
    updateData  : function (){
      var idsBeforeUpdate = this.pluck("_id");
      var idsAfterUpdate;

      clearTimeout(this.timeout);

      twitchApi.send("followed", {}, function (err, res){

        this.timeout = setTimeout(this.updateData.bind(this), settings.get("refreshInterval").get("value") * 60 * 1000);

        if ( err ) {
          if ( err.status && err.status == 401 ) {
            return this.trigger("error", "auth");
          }
          return this.trigger("error", "api");
        }
        if ( !res || !res.streams ) {
          return this.trigger("error", "api");
        }
        if ( res.streams.length == 0 ) {
          return this.trigger("error", "nostreams");
        }

        this.set(res.streams, {silent: true});

        idsAfterUpdate = this.pluck("_id");
        this.addedStreams = _.difference(idsAfterUpdate, idsBeforeUpdate, this.notified);
        this.notified = _.union(this.addedStreams, this.notified);
        this.trigger("update");
      }.bind(this));
    }
  });

  var GameLobby = Backbone.Model.extend({
    initialize: function (){
      this.streams = new GameStreams;
      this.videos = new GameVideos;
      this.game = new Game;
    },
    lookupGame: function (gameName){
      return games.findByName(gameName) || followedgames.findByName(gameName);
    },
    setGame   : function (gameName){
      var game = this.lookupGame(gameName);
      if ( game ) {
        var gameJSON = game.toJSON();
        this.streams.game = gameName;
        this.videos.game = gameName;
        this.game.set(gameJSON);
      }
    }
  });

  var GameStreams = StreamCollection.extend({
    game      : null,
    updateData: function (){
      twitchApi.send("streams", {game: this.game, limit: 50}, function (err, res){
        if ( err ) {
          return this.trigger("error", "api");
        }
        this.reset(res.streams, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  });

  var TopStreamsCollection = StreamCollection.extend({
    updateData: function (){
      twitchApi.send("streams", {limit: 50}, function (err, res){
        this.timeout = setTimeout(this.updateData.bind(this), 5 * 60 * 1000);
        if ( err ) {
          return this.trigger("error", "api");
        }
        this.reset(res.streams, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  });

  var SearchCollection = StreamCollection.extend({
    query     : null,
    updateData: function (){
      if ( !this.query ) {
        return this.trigger("error", "nosearchquery");
      }
      twitchApi.send("searchStreams", {query: this.query, limit: 50}, function (err, res){
        if ( err || !res || !res.streams ) {
          return this.trigger("error", "api");
        }
        if ( res.streams.length == 0 ) {
          return this.trigger("error", "nosearchresults");
        }
        this.reset(res.streams, {silent: true});
        this.trigger("update");
      }.bind(this));
    }
  });

  var Contributor = Backbone.Model.extend();

  var ContributorCollection = Backbone.Collection.extend({
    model     : Contributor,
    url       : "https://api.github.com/repos/ndragomirov/twitch-now/contributors",
    initialize: function (){
      this.updateData();
    },
    updateData: function (){
      this.fetch({reset: true});
    }
  });

  var Donation = Backbone.Model.extend();

  var DonationCollection = Backbone.Collection.extend({
    model     : Donation,
    url       : "http://162.243.34.81:8080/payments",
    initialize: function (){
      this.interval = 10 * 60 * 1000;
      this.updateData();
    },
    updateData: function (){
      var self = this;
      this.fetch({reset: true});
      setTimeout(function (){
        self.fetch({reset: true})
      }, self.interval);
    }
  });


  var Badge = Backbone.Model.extend({
    defaults         : {
      count: 0
    },
    initialize       : function (){
      var self = this;

      self.on("change:count", function (){
        if ( settings.get("showBadge").get("value") ) {
          bgApp.setBadge(self.get("count"));
        }
      });

      settings.on("change:value", function (model, value){
        if ( model.get("id") == "showBadge" ) {
          self.onShowBadgeChange(value);
        }
      });
    },
    onShowBadgeChange: function (value){
      if ( value ) {
        bgApp.setBadge(this.get("count"));
      } else {
        bgApp.clearBadge();
      }
    }
  })

  bgApp.bindNotificationListeners();

  StreamCollection.mixin(TrackLastErrorMixin);
  Games.mixin(TrackLastErrorMixin);
  FollowingCollection.mixin(TrackLastErrorMixin);
  TopStreamsCollection.mixin(TrackLastErrorMixin);
  Videos.mixin(TrackLastErrorMixin);
  FollowedGames.mixin(TrackLastErrorMixin);
  SearchCollection.mixin(TrackLastErrorMixin);

  var settings = root.settings = new Settings;
  var badge = root.badge = new Badge;
  var notifications = root.notifications = new NotificationSettings;
  var donations = root.donations = new DonationCollection;
  var contributors = root.contributors = new ContributorCollection;
  var following = root.following = new FollowingCollection;
  var followedgames = root.followedgames = new FollowedGames;
  var topstreams = root.topstreams = new TopStreamsCollection;
  var videos = root.videos = new ChannelVideos;
  var games = root.games = new Games;
  var search = root.search = new SearchCollection;
  var user = root.user = new User;
  var gameLobby = root.gameLobby = new GameLobby;

  var addToFollowing = function (stream){
    following.add(stream)
  }

  topstreams.on("follow", addToFollowing);
  search.on("follow", addToFollowing)
  gameLobby.streams.on("follow", addToFollowing);

  games.on("follow", function (game){
    followedgames.add(game);
  })

  gameLobby.game.on("follow", function (game){
    followedgames.add(game);
  })

  games.on("unfollow", function (game){
    followedgames.remove(followedgames.findByName(game.get("game").name));
  })

  followedgames.on("unfollow", function (game){
    followedgames.remove(game);
  })

  topstreams.updateData();
  games.updateData();

  bgApp.init();

}).call(this);