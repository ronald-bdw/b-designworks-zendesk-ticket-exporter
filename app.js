(function() {
  require.modules = {
    "sortable.js": function(exports, require, module) {
        /*
    * HTML5 Sortable jQuery Plugin
    * https://github.com/voidberg/html5sortable
    *
    * Original code copyright 2012 Ali Farhadi.
    * This version is mantained by Alexandru Badiu <andu@ctrlz.ro>
    *
    * Thanks to the following contributors: andyburke, bistoco, daemianmack, drskullster, flying-sheep, OscarGodson, Parikshit N. Samant, rodolfospalenza, ssafejava
    *
    * Released under the MIT license.
    */

      module.exports = function (elem, options) {
        'use strict';
        var dragging, draggingHeight;
        var $ = elem.constructor;
        var placeholders = $();
        var method = String(options);

        options = $.extend({
          connectWith: false,
          placeholder: null,
          dragImage: null
        }, options);

        return elem.each(function () {
          if (method === 'reload') {
            $(this).children(options.items).off('dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s');
          }
          if (/^enable|disable|destroy$/.test(method)) {
            var citems = $(this).children($(this).data('items')).attr('draggable', method === 'enable');
            if (method === 'destroy') {
              $(this).off('sortupdate');
              $(this).removeData('opts');
              citems.add(this).removeData('connectWith items')
                .off('dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s').off('sortupdate');
            }
            return;
          }

          var soptions = $(this).data('opts');

          if (typeof soptions === 'undefined') {
            $(this).data('opts', options);
          }
          else {
            options = soptions;
          }

          var isHandle, index, items = $(this).children(options.items);
          var startParent, newParent;
          var placeholder = ( options.placeholder === null ) ? $('<' + (/^ul|ol$/i.test(this.tagName) ? 'li' : 'div') + ' class="sortable-placeholder"/>') : $(options.placeholder).addClass('sortable-placeholder');

          items.find(options.handle).mousedown(function () {
            isHandle = true;
          }).mouseup(function () {
              isHandle = false;
            });
          $(this).data('items', options.items);
          placeholders = placeholders.add(placeholder);
          if (options.connectWith) {
            $(options.connectWith).add(this).data('connectWith', options.connectWith);
          }

          items.attr('role', 'option');
          items.attr('aria-grabbed', 'false');

          items.attr('draggable', 'true').on('dragstart.h5s',function (e) {
            e.stopImmediatePropagation();
            if (options.handle && !isHandle) {
              return false;
            }
            isHandle = false;
            var dt = e.originalEvent.dataTransfer;
            dt.effectAllowed = 'move';
            dt.setData('text', '');

            if (options.dragImage && dt.setDragImage) {
              dt.setDragImage(options.dragImage, 0, 0);
            }

            index = (dragging = $(this)).addClass('sortable-dragging').attr('aria-grabbed', 'true').index();
            draggingHeight = dragging.outerHeight();
            startParent = $(this).parent();
          }).on('dragend.h5s',function () {
            if (!dragging) {
              return;
            }
            dragging.removeClass('sortable-dragging').attr('aria-grabbed', 'false').show();
            placeholders.detach();
            newParent = $(this).parent();
            if (index !== dragging.index() || startParent.get(0) !== newParent.get(0)) {
              dragging.parent().triggerHandler('sortupdate', {item: dragging, oldindex: index, startparent: startParent, endparent: newParent});
            }
            dragging = null;
            draggingHeight = null;
          }).not('a[href], img').on('selectstart.h5s',function () {
            if (options.handle && !isHandle) {
              return true;
            }

            if (this.dragDrop) {
              this.dragDrop();
            }
            return false;
          }).end().add([this, placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', function (e) {
            if (!items.is(dragging) && options.connectWith !== $(dragging).parent().data('connectWith')) {
              return true;
            }
            if (e.type === 'drop') {
              e.stopPropagation();
              placeholders.filter(':visible').after(dragging);
              dragging.trigger('dragend.h5s');
              return false;
            }
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'move';
            if (items.is(this)) {
              var thisHeight = $(this).outerHeight();
              if (options.forcePlaceholderSize) {
                placeholder.height(draggingHeight);
              }

              // Check if $(this) is bigger than the draggable. If it is, we have to define a dead zone to prevent flickering
              if (thisHeight > draggingHeight) {
                // Dead zone?
                var deadZone = thisHeight - draggingHeight, offsetTop = $(this).offset().top;
                if (placeholder.index() < $(this).index() && e.originalEvent.pageY < offsetTop + deadZone) {
                  return false;
                }
                else if (placeholder.index() > $(this).index() && e.originalEvent.pageY > offsetTop + thisHeight - deadZone) {
                  return false;
                }
              }

              dragging.hide();
              $(this)[placeholder.index() < $(this).index() ? 'after' : 'before'](placeholder);
              placeholders.not(placeholder).detach();
            } else if (!placeholders.is(this) && !$(this).children(options.items).length) {
              placeholders.detach();
              $(this).append(placeholder);
            }
            return false;
          });
        });
      };
    },
    eom: undefined
  };
  return {
    requests: {
      getViews: function (url) {
        return {
          url:         url || '/api/v2/views/active.json?sort_by=alphabetical',
          type:        'GET',
          cache:       false
        };
      },

      getBrands: function (url) {
        return {
          url:         url || '/api/v2/brands.json',
          type:        'GET',
          cache:       false
        };
      },

      getFields: function (url) {
        return {
          url:         url || '/api/v2/ticket_fields.json',
          type:        'GET',
          cache:       false
        };
      },

      getViewCount: function(id) {
        return {
          url:         '/api/v2/views/'+id+'/count.json',
          type:        'GET',
          cache:       false
        };
      },

      getTicketsFromView: function(url) {
        return {
          url:         url,
          type:        'GET',
          cache:       false
        };
      }

    },

    events: {
      'app.created':'load',
      'zd_ui_change .view_id': 'viewChange',
      'getViewCount.done':'showViewCount',
      'click #view_continue':'switchToFields',
      'click #fields_back':function() {  this.switchToView(false); },
      'click #fields_continue':'switchToSettings',
      'click #settings_back':'switchToFields',
      'click #settings_continue':'startExport',
      'click #export':'startExport',
      'click #download_back':'switchToSettings',
      'click #download_ie':'downloadFileIE',
      'click #ticket':function() {  this.toggleFields('ticket'); },
      'click #channel':function() {  this.toggleFields('channel'); },
      'click #requester':function() {  this.toggleFields('requester'); },
      'click #submitter':function() {  this.toggleFields('submitter'); },
      'click #assignee':function() {  this.toggleFields('assignee'); },
      'click #group':function() {  this.toggleFields('group'); },
      'click #custom':function() {  this.toggleFields('custom'); },
      'getTicketsFromView.done':'processTickets'
    },

    load: function() {
      this.csv = '';
      this.page = 0;
      this.records = 0;
      this.estimate = 0;
      this.views = [];
      this.brands = [];
      this.fields = [
        {id: 0, display: this.I18n.t('fields.id'), name: 'id', type: 'number'},
        {id: 1, display: this.I18n.t('fields.external_id'), name: 'external_id', type: 'text'},
        {id: 2, display: this.I18n.t('fields.type'), name: 'type', type: 'text'},
        {id: 3, display: this.I18n.t('fields.subject'), name: 'subject', type: 'text'},
        {id: 4, display: this.I18n.t('fields.raw_subject'), name: 'raw_subject', type: 'text'},
        {id: 5, display: this.I18n.t('fields.description'), name: 'description', type: 'text'},
        {id: 6, display: this.I18n.t('fields.priority'), name: 'priority', type: 'text'},
        {id: 7, display: this.I18n.t('fields.status'), name: 'status', type: 'text'},
        {id: 8, display: this.I18n.t('fields.recipient'), name: 'recipient', type: 'text'},
        {id: 9, display: this.I18n.t('fields.forum_topic_id'), name: 'forum_topic_id', type: 'number'},
        {id: 10, display: this.I18n.t('fields.problem_id'), name: 'problem_id', type: 'number'},
        {id: 11, display: this.I18n.t('fields.has_incidents'), name: 'has_incidents', type: 'boolean'},
        {id: 12, display: this.I18n.t('fields.due_at'), name: 'due_at', type: 'date'},
        {id: 13, display: this.I18n.t('fields.tags'), name: 'tags', type: 'array'},
        {id: 14, display: this.I18n.t('fields.comment_count'), name: 'comment_count', type: 'number'},
        {id: 15, display: this.I18n.t('fields.created_at'), name: 'created_at', type: 'date'},
        {id: 16, display: this.I18n.t('fields.updated_at'), name: 'updated_at', type: 'date'},

        {id: 17, display: this.I18n.t('fields.via.channel'), name: 'channel', type: 'text', belongs_to: 'via', group_with: 'channel'},
        {id: 18, display: this.I18n.t('fields.via.email.from.address'), name: 'source.from.address', type: 'text', belongs_to: 'via.email', group_with: 'channel'},
        {id: 19, display: this.I18n.t('fields.via.email.from.name'), name: 'source.from.name', type: 'text', belongs_to: 'via.email', group_with: 'channel'},
        {id: 20, display: this.I18n.t('fields.via.email.to.address'), name: 'source.to.address', type: 'text', belongs_to: 'via.email', group_with: 'channel'},
        {id: 21, display: this.I18n.t('fields.via.email.to.name'), name: 'source.to.name', type: 'text', belongs_to: 'via.email', group_with: 'channel'},
        {id: 22, display: this.I18n.t('fields.via.twitter.from.name'), name: 'source.from.name', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 23, display: this.I18n.t('fields.via.twitter.from.username'), name: 'source.from.username', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 24, display: this.I18n.t('fields.via.twitter.from.profile_url'), name: 'source.from.profile_url', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 25, display: this.I18n.t('fields.via.twitter.to.name'), name: 'source.to.name', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 26, display: this.I18n.t('fields.via.twitter.to.username'), name: 'source.to.username', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 27, display: this.I18n.t('fields.via.twitter.to.profile_url'), name: 'source.to.profile_url', type: 'text', belongs_to: 'via.twitter', group_with: 'channel'},
        {id: 28, display: this.I18n.t('fields.via.voice.from.phone'), name: 'source.from.phone', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 29, display: this.I18n.t('fields.via.voice.from.formatted_phone'), name: 'source.from.formatted_phone', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 30, display: this.I18n.t('fields.via.voice.from.name'), name: 'source.from.name', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 31, display: this.I18n.t('fields.via.voice.to.phone'), name: 'source.to.phone', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 32, display: this.I18n.t('fields.via.voice.to.formatted_phone'), name: 'source.to.formatted_phone', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 33, display: this.I18n.t('fields.via.voice.to.name'), name: 'source.to.name', type: 'text', belongs_to: 'via.voice', group_with: 'channel'},
        {id: 34, display: this.I18n.t('fields.via.facebook.from.name'), name: 'source.from.name', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},
        {id: 35, display: this.I18n.t('fields.via.facebook.from.facebook_id'), name: 'source.from.facebook_id', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},
        {id: 36, display: this.I18n.t('fields.via.facebook.from.profile_url'), name: 'source.from.profile_url', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},
        {id: 37, display: this.I18n.t('fields.via.facebook.to.name'), name: 'source.to.name', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},
        {id: 38, display: this.I18n.t('fields.via.facebook.to.facebook_id'), name: 'source.to.facebook_id', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},
        {id: 39, display: this.I18n.t('fields.via.facebook.to.profile_url'), name: 'source.to.profile_url', type: 'text', belongs_to: 'via.facebook', group_with: 'channel'},

        {id: 40, display: this.I18n.t('fields.assignee_updated_at'), name: 'dates.assignee_updated_at', type: 'date'},
        {id: 41, display: this.I18n.t('fields.requester_updated_at'), name: 'dates.requester_updated_at', type: 'date'},
        {id: 42, display: this.I18n.t('fields.status_updated_at'), name: 'dates.status_updated_at', type: 'date'},
        {id: 43, display: this.I18n.t('fields.initially_assigned_at'), name: 'dates.initially_assigned_at', type: 'date'},
        {id: 44, display: this.I18n.t('fields.assigned_at'), name: 'dates.assigned_at', type: 'date'},
        {id: 45, display: this.I18n.t('fields.solved_at'), name: 'dates.solved_at', type: 'date'},
        {id: 46, display: this.I18n.t('fields.latest_comment_added_at'), name: 'dates.latest_comment_added_at', type: 'date'},

        {id: 121, display: this.I18n.t('fields.satisfaction_rating.score'), name: 'satisfaction_rating.score', type: 'text'},
        {id: 122, display: this.I18n.t('fields.satisfaction_rating.comment'), name: 'satisfaction_rating.comment', type: 'text'},

        {id: 47, display: this.I18n.t('fields.user.id', { user: this.I18n.t('fields.user.requester') }), name: 'id', type: 'number', belongs_to: 'requester'},
        {id: 48, display: this.I18n.t('fields.user.external_id', { user: this.I18n.t('fields.user.requester') }), name: 'external_id', type: 'number', belongs_to: 'requester'},
        {id: 49, display: this.I18n.t('fields.user.name', { user: this.I18n.t('fields.user.requester') }), name: 'name', type: 'text', belongs_to: 'requester'},
        {id: 50, display: this.I18n.t('fields.user.alias', { user: this.I18n.t('fields.user.requester') }), name: 'alias', type: 'text', belongs_to: 'requester'},
        {id: 51, display: this.I18n.t('fields.user.email', { user: this.I18n.t('fields.user.requester') }), name: 'email', type: 'text', belongs_to: 'requester'},
        {id: 52, display: this.I18n.t('fields.user.phone', { user: this.I18n.t('fields.user.requester') }), name: 'phone', type: 'text', belongs_to: 'requester'},
        {id: 53, display: this.I18n.t('fields.user.locale', { user: this.I18n.t('fields.user.requester') }), name: 'locale', type: 'text', belongs_to: 'requester'},
        {id: 54, display: this.I18n.t('fields.user.time_zone', { user: this.I18n.t('fields.user.requester') }), name: 'time_zone', type: 'text', belongs_to: 'requester'},
        {id: 55, display: this.I18n.t('fields.user.role', { user: this.I18n.t('fields.user.requester') }), name: 'role', type: 'text', belongs_to: 'requester'},
        {id: 56, display: this.I18n.t('fields.user.details', { user: this.I18n.t('fields.user.requester') }), name: 'details', type: 'text', belongs_to: 'requester'},
        {id: 57, display: this.I18n.t('fields.user.notes', { user: this.I18n.t('fields.user.requester') }), name: 'notes', type: 'text', belongs_to: 'requester'},
        {id: 58, display: this.I18n.t('fields.user.tags', { user: this.I18n.t('fields.user.requester') }), name: 'tags', type: 'array', belongs_to: 'requester'},
        {id: 59, display: this.I18n.t('fields.user.active', { user: this.I18n.t('fields.user.requester') }), name: 'active', type: 'boolean', belongs_to: 'requester'},
        {id: 60, display: this.I18n.t('fields.user.verified', { user: this.I18n.t('fields.user.requester') }), name: 'verified', type: 'boolean', belongs_to: 'requester'},
        {id: 61, display: this.I18n.t('fields.user.suspended', { user: this.I18n.t('fields.user.requester') }), name: 'suspended', type: 'boolean', belongs_to: 'requester'},
        {id: 62, display: this.I18n.t('fields.user.created_at', { user: this.I18n.t('fields.user.requester') }), name: 'created_at', type: 'date', belongs_to: 'requester'},
        {id: 63, display: this.I18n.t('fields.user.updated_at', { user: this.I18n.t('fields.user.requester') }), name: 'updated_at', type: 'date', belongs_to: 'requester'},
        {id: 64, display: this.I18n.t('fields.user.last_login_at', { user: this.I18n.t('fields.user.requester') }), name: 'last_login_at', type: 'date', belongs_to: 'requester'},

        {id: 65, display: this.I18n.t('fields.user.id', { user: this.I18n.t('fields.user.submitter') }), name: 'id', type: 'number', belongs_to: 'submitter'},
        {id: 66, display: this.I18n.t('fields.user.external_id', { user: this.I18n.t('fields.user.submitter') }), name: 'external_id', type: 'number', belongs_to: 'submitter'},
        {id: 67, display: this.I18n.t('fields.user.name', { user: this.I18n.t('fields.user.submitter') }), name: 'name', type: 'text', belongs_to: 'submitter'},
        {id: 68, display: this.I18n.t('fields.user.alias', { user: this.I18n.t('fields.user.submitter') }), name: 'alias', type: 'text', belongs_to: 'submitter'},
        {id: 69, display: this.I18n.t('fields.user.email', { user: this.I18n.t('fields.user.submitter') }), name: 'email', type: 'text', belongs_to: 'submitter'},
        {id: 70, display: this.I18n.t('fields.user.phone', { user: this.I18n.t('fields.user.submitter') }), name: 'phone', type: 'text', belongs_to: 'submitter'},
        {id: 71, display: this.I18n.t('fields.user.locale', { user: this.I18n.t('fields.user.submitter') }), name: 'locale', type: 'text', belongs_to: 'submitter'},
        {id: 72, display: this.I18n.t('fields.user.time_zone', { user: this.I18n.t('fields.user.submitter') }), name: 'time_zone', type: 'text', belongs_to: 'submitter'},
        {id: 73, display: this.I18n.t('fields.user.role', { user: this.I18n.t('fields.user.submitter') }), name: 'role', type: 'text', belongs_to: 'submitter'},
        {id: 74, display: this.I18n.t('fields.user.details', { user: this.I18n.t('fields.user.submitter') }), name: 'details', type: 'text', belongs_to: 'submitter'},
        {id: 75, display: this.I18n.t('fields.user.notes', { user: this.I18n.t('fields.user.submitter') }), name: 'notes', type: 'text', belongs_to: 'submitter'},
        {id: 76, display: this.I18n.t('fields.user.tags', { user: this.I18n.t('fields.user.submitter') }), name: 'tags', type: 'array', belongs_to: 'submitter'},
        {id: 77, display: this.I18n.t('fields.user.active', { user: this.I18n.t('fields.user.submitter') }), name: 'active', type: 'boolean', belongs_to: 'submitter'},
        {id: 78, display: this.I18n.t('fields.user.verified', { user: this.I18n.t('fields.user.submitter') }), name: 'verified', type: 'boolean', belongs_to: 'submitter'},
        {id: 79, display: this.I18n.t('fields.user.suspended', { user: this.I18n.t('fields.user.submitter') }), name: 'suspended', type: 'boolean', belongs_to: 'submitter'},
        {id: 80, display: this.I18n.t('fields.user.created_at', { user: this.I18n.t('fields.user.submitter') }), name: 'created_at', type: 'date', belongs_to: 'submitter'},
        {id: 81, display: this.I18n.t('fields.user.updated_at', { user: this.I18n.t('fields.user.submitter') }), name: 'updated_at', type: 'date', belongs_to: 'submitter'},
        {id: 82, display: this.I18n.t('fields.user.last_login_at', { user: this.I18n.t('fields.user.submitter') }), name: 'last_login_at', type: 'date', belongs_to: 'submitter'},

        {id: 83, display: this.I18n.t('fields.user.id', { user: this.I18n.t('fields.user.assignee') }), name: 'id', type: 'number', belongs_to: 'assignee'},
        {id: 84, display: this.I18n.t('fields.user.external_id', { user: this.I18n.t('fields.user.assignee') }), name: 'external_id', type: 'number', belongs_to: 'assignee'},
        {id: 85, display: this.I18n.t('fields.user.name', { user: this.I18n.t('fields.user.assignee') }), name: 'name', type: 'text', belongs_to: 'assignee'},
        {id: 86, display: this.I18n.t('fields.user.alias', { user: this.I18n.t('fields.user.assignee') }), name: 'alias', type: 'text', belongs_to: 'assignee'},
        {id: 87, display: this.I18n.t('fields.user.email', { user: this.I18n.t('fields.user.assignee') }), name: 'email', type: 'text', belongs_to: 'assignee'},
        {id: 88, display: this.I18n.t('fields.user.phone', { user: this.I18n.t('fields.user.assignee') }), name: 'phone', type: 'text', belongs_to: 'assignee'},
        {id: 89, display: this.I18n.t('fields.user.locale', { user: this.I18n.t('fields.user.assignee') }), name: 'locale', type: 'text', belongs_to: 'assignee'},
        {id: 90, display: this.I18n.t('fields.user.time_zone', { user: this.I18n.t('fields.user.assignee') }), name: 'time_zone', type: 'text', belongs_to: 'assignee'},
        {id: 91, display: this.I18n.t('fields.user.role', { user: this.I18n.t('fields.user.assignee') }), name: 'role', type: 'text', belongs_to: 'assignee'},
        {id: 92, display: this.I18n.t('fields.user.details', { user: this.I18n.t('fields.user.assignee') }), name: 'details', type: 'text', belongs_to: 'assignee'},
        {id: 93, display: this.I18n.t('fields.user.notes', { user: this.I18n.t('fields.user.assignee') }), name: 'notes', type: 'text', belongs_to: 'assignee'},
        {id: 94, display: this.I18n.t('fields.user.tags', { user: this.I18n.t('fields.user.assignee') }), name: 'tags', type: 'array', belongs_to: 'assignee'},
        {id: 95, display: this.I18n.t('fields.user.active', { user: this.I18n.t('fields.user.assignee') }), name: 'active', type: 'boolean', belongs_to: 'assignee'},
        {id: 96, display: this.I18n.t('fields.user.verified', { user: this.I18n.t('fields.user.assignee') }), name: 'verified', type: 'boolean', belongs_to: 'assignee'},
        {id: 97, display: this.I18n.t('fields.user.suspended', { user: this.I18n.t('fields.user.assignee') }), name: 'suspended', type: 'boolean', belongs_to: 'assignee'},
        {id: 98, display: this.I18n.t('fields.user.created_at', { user: this.I18n.t('fields.user.assignee') }), name: 'created_at', type: 'date', belongs_to: 'assignee'},
        {id: 99, display: this.I18n.t('fields.user.updated_at', { user: this.I18n.t('fields.user.assignee') }), name: 'updated_at', type: 'date', belongs_to: 'assignee'},
        {id: 100, display: this.I18n.t('fields.user.last_login_at', { user: this.I18n.t('fields.user.assignee') }), name: 'last_login_at', type: 'date', belongs_to: 'assignee'},

        {id: 101, display: this.I18n.t('fields.group.id'), name: 'id', type: 'number', belongs_to: 'group'},
        {id: 102, display: this.I18n.t('fields.group.name'), name: 'name', type: 'text', belongs_to: 'group'},
        {id: 103, display: this.I18n.t('fields.group.created_at'), name: 'created_at', type: 'date', belongs_to: 'group'},
        {id: 104, display: this.I18n.t('fields.group.updated_at'), name: 'updated_at', type: 'date', belongs_to: 'group'},

        {id: 105, display: this.I18n.t('fields.organization.id'), name: 'id', type: 'number', belongs_to: 'organization', group_with: 'group'},
        {id: 106, display: this.I18n.t('fields.organization.external_id'), name: 'external_id', type: 'number', belongs_to: 'organization', group_with: 'group'},
        {id: 107, display: this.I18n.t('fields.organization.name'), name: 'name', type: 'text', belongs_to: 'organization', group_with: 'group'},
        {id: 108, display: this.I18n.t('fields.organization.details'), name: 'details', type: 'text', belongs_to: 'organization', group_with: 'group'},
        {id: 109, display: this.I18n.t('fields.organization.notes'), name: 'notes', type: 'text', belongs_to: 'organization', group_with: 'group'},
        {id: 110, display: this.I18n.t('fields.organization.tags'), name: 'tags', type: 'array', belongs_to: 'organization', group_with: 'group'},
        {id: 111, display: this.I18n.t('fields.organization.domain_names'), name: 'domain_names', type: 'array', belongs_to: 'organization', group_with: 'group'},
        {id: 112, display: this.I18n.t('fields.organization.created_at'), name: 'created_at', type: 'date', belongs_to: 'organization', group_with: 'group'},
        {id: 113, display: this.I18n.t('fields.organization.updated_at'), name: 'updated_at', type: 'date', belongs_to: 'organization', group_with: 'group'},

        {id: 114, display: this.I18n.t('fields.brand.id'), name: 'id', type: 'number', belongs_to: 'brand', group_with: 'group'},
        {id: 115, display: this.I18n.t('fields.brand.name'), name: 'name', type: 'text', belongs_to: 'brand', group_with: 'group'},
        {id: 116, display: this.I18n.t('fields.brand.url'), name: 'brand_url', type: 'text', belongs_to: 'brand', group_with: 'group'},
        {id: 117, display: this.I18n.t('fields.brand.active'), name: 'active', type: 'boolean', belongs_to: 'brand', group_with: 'group'},
        {id: 118, display: this.I18n.t('fields.brand.default'), name: 'default', type: 'boolean', belongs_to: 'brand', group_with: 'group'},
        {id: 119, display: this.I18n.t('fields.brand.created_at'), name: 'created_at', type: 'date', belongs_to: 'brand', group_with: 'group'},
        {id: 120, display: this.I18n.t('fields.brand.updated_at'), name: 'updated_at', type: 'date', belongs_to: 'brand', group_with: 'group'}
      ];
      this.fd = [
        {name: this.I18n.t('fd.semicolon'), value: ";"},
        {name: this.I18n.t('fd.comma'), value: ","},
        {name: this.I18n.t('fd.hash'), value: "#"},
        {name: this.I18n.t('fd.pipe'), value: "|"}
      ];
      this.td = [
        {name: this.I18n.t('td.quotes'), value: '"'},
        {name: this.I18n.t('td.quote'), value: "'"}
      ];
      this.df = [
        {name: this.I18n.t('df.csv'), value: "YYYY-MM-DD HH:mm:ss"},
        {name: this.I18n.t('df.local'), value: "LLL"},
        {name: this.I18n.t('df.dmy'), value: "DD-MM-YYYY HH:mm"},
        {name: this.I18n.t('df.usa'), value: "MM/DD/YYYY h:mm A"},
        {name: this.I18n.t('df.iso'), value: "YYYY-MM-DDTHH:mm:ssZ"},
        {name: this.I18n.t('df.unix'), value: "X"}
      ];

      this.switchTo('loading');

      this.when(
        this.ajaxAll('views', 'getViews'),
        this.ajaxAll('brands', 'getBrands'),
        this.ajaxAll('fields', 'getFields')
      ).then(this.switchToView.bind(this));
    },

    ajaxAll: function(name, request) {
      return this.promise(function(resolve, reject) {
        this.ajax(request).done(function requestDone(data) {
          this.loadingMessage();
          if (name == 'fields') {
            _.each(data.ticket_fields, function(ticket_field) {
              if(ticket_field.type === 'text' || ticket_field.type === 'textarea' || ticket_field.type === 'regexp' || ticket_field.type === 'tagger') {
                this.fields.push({id: ticket_field.id, display: ticket_field.title, name: ticket_field.id, type: 'text', belongs_to: 'custom'});
              } else if (ticket_field.type === 'decimal' || ticket_field.type === 'integer') {
                this.fields.push({id: ticket_field.id, display: ticket_field.title, name: ticket_field.id, type: 'number', belongs_to: 'custom'});
              } else if (ticket_field.type === 'checkbox') {
                this.fields.push({id: ticket_field.id, display: ticket_field.title, name: ticket_field.id, type: 'boolean', belongs_to: 'custom'});
              } else if (ticket_field.type === 'date') {
                this.fields.push({id: ticket_field.id, display: ticket_field.title, name: ticket_field.id, type: 'date', belongs_to: 'custom'});
              }
            }.bind(this));
          } else {
            this[name] = this[name].concat(data[name]);
          }
          if (data.next_page) {
            this.ajax(request, data.next_page).done(requestDone).fail(reject);
          } else {
            resolve(this[name]);
          }
        }).fail(reject);
      }.bind(this));
    },

    viewChange: function() {
      this.$('#view_continue').prop('disabled', true);
      if(typeof this.$('.view_id').zdComboSelectMenu('value') === 'object') {
        _.delay(this.viewChange.bind(this), 100); //in case DOM wasn't ready yet
      } else if (this.$('.view_id').zdComboSelectMenu('value')) {
        this.$('#message').html('<div class="spinner dotted"></div>');
        this.ajax('getViewCount', this.$('.view_id').zdComboSelectMenu('value'));
      } else {
        this.$('#message').text('');
      }
    },

    showViewCount: function(data) {
      if(data.view_count.fresh) {
        if(data.view_count.value > 0) {
          this.$('#message').text(this.I18n.t('view_count', { count: data.view_count.value }));
          this.$('#view_continue').prop('disabled', false);
        } else {
          this.$('#message').text(this.I18n.t('view_count_zero'));
        }

      } else {
        this.ajax('getViewCount', this.$('.view_id').zdComboSelectMenu('value'));
      }
    },

    toggleFields: function(cl) {
      this.$('.btn-group .btn').removeClass('active');
      this.$('.btn-group .btn#'+cl).addClass('active');
      this.$('#exclude').attr('class', cl);
      this.$('#exclude ul li.sortable').removeAttr('style');
    },

    startExport: function() {
      this.store('filename', (this.$('#filename').val()) ? this.$('#filename').val().replace(/[^a-z0-9_-]/gi, '_') : 'export');
      this.store('field_delimiter', this.$('#field_delimiter').val());
      this.store('text_delimiter', this.$('#text_delimiter').val());
      this.store('date_format', this.$('#date_format').val());
      this.store('remove_line_breaks', (this.$('#remove_line_breaks').val() === 'true') ? true : false);

      this.switchTo('download');

      var td = this.store('text_delimiter');
      var fd = this.store('field_delimiter');

      this.page = 0;
      this.estimate = 0;
      this.records = 0;

      var line = '';
      _.each(this.store('fields'), function(id) {
        var field = _.findWhere(this.fields, {id: id});
        line = line.concat(td + field.display.replace(RegExp(td, "g"), td+td) + td + fd);
      }.bind(this));
      this.csv = line.slice(0, -1) + '\n';

      this.page = 0;
      this.ajax('getTicketsFromView', '/api/v2/views/'+this.store('view')+'/tickets.json?include=users,groups,organizations,dates,comment_count,ticket_forms');
    },

    processTickets: function(data) {
      this.page++;

      if (!this.estimate) { this.estimate = data.count; }

      this.$('.bar').css('width', this.page/Math.ceil(data.count/100)*100 + "%");

      var line = '';
      var td = this.store('text_delimiter');
      var fd = this.store('field_delimiter');

      _.each(data.tickets, function(ticket) {
        line = '';
        this.records++;

        _.each(this.store('fields'), function(id) {
          var field = _.findWhere(this.fields, {id: id});
          var value = '';
          var result = '';

          if (field.belongs_to === 'group') {
            value = ((result = _.findWhere(data.groups, {id: ticket.group_id})) && result[field.name]);
          } else if (field.belongs_to === 'organization') {
            value = ((result = _.findWhere(data.organizations, {id: ticket.organization_id})) && result[field.name]);
          } else if (field.belongs_to === 'brand') {
            value = ((result = _.findWhere(this.brands, {id: ticket.brand_id})) && result[field.name]);
          } else if (field.belongs_to === 'requester') {
            value = ((result = _.findWhere(data.users, {id: ticket.requester_id})) && result[field.name]);
          } else if (field.belongs_to === 'submitter') {
            value = ((result = _.findWhere(data.users, {id: ticket.submitter_id})) && result[field.name]);
          } else if (field.belongs_to === 'assignee') {
            value = ((result = _.findWhere(data.users, {id: ticket.assignee_id})) && result[field.name]);
          } else if ((field.belongs_to ? field.belongs_to : '').startsWith('via')) {
            if (field.belongs_to.indexOf('.') > -1) {
              if (field.belongs_to.split('.')[1] === ticket.via.channel) {
                value = this.byString(ticket.via, field.name);
              }
            } else {
              value = ticket.via[field.name];
            }
          } else if (field.belongs_to === 'custom') {
            value = ((result = _.findWhere(ticket.custom_fields, {id: Number(field.name)})) && result['value']);
          } else {
            if (field.name.indexOf('.') > -1) {
              value = this.byString(ticket, field.name);
            } else {
              value = ticket[field.name];
            }
          }

          if (field.type === 'text') {
            line = line.concat(td + ((value) ? ((this.store('remove_line_breaks')) ? value.replace(RegExp('\r?\n{1,}','g'), ' ') : value).replace(RegExp(td, "g"), td+td) : '') + td);
          } else if (field.type === 'date') {
            line = line.concat(td + ((value) ? moment(value).format(this.store('date_format')) : '') + td);
          } else if (field.type === 'array') {
            line = line.concat(td + ((value) ? value.toString() : '') + td);
          } else {
            line = line.concat((value) ? value: '');
          }

          line = line.concat(fd);
        }.bind(this));
        this.csv = this.csv.concat(line.slice(0, -1) + '\n');
      }.bind(this));

      if (data.next_page) {
        this.ajax('getTicketsFromView', data.next_page);
      } else {
        this.downloadFile();
      }
    },

    switchToView: function(skip) {
      this.switchTo('view', {
        views: this.views.map(function(view) {
          return {
            id: view.id,
            selected: view.id === this.store('view') ? 'selected' : '',
            title: view.title
          };
        }, this)
      });
      this.$('[data-zd-type="combo_select_menu"]').zdComboSelectMenu();
      if(this.store('view')) {
        this.viewChange();
      }
    },

    switchToFields: function() {
      if(!isNaN(this.$('.view_id').zdComboSelectMenu('value'))) {
        this.store('view', Number(this.$('.view_id').zdComboSelectMenu('value')));
      }

      if(!this.store('fields')) {
        this.store('fields',[0,3,7,15]);
      }

      this.switchTo('fields', {
        fields: this.fields.map(function(field) {
          return {
            id: field.id,
            name: field.display,
            selected: (this.store('fields').indexOf(field.id) > -1) ? true : false,
            css: field.group_with || field.belongs_to || 'ticket'
          };
        }, this)
      });

      /*
      this.$("#available_columns, #selected_columns").sortable({
        connectWith: ".sortablelist"
      });

      this.$('ul').sortable({
        connectWith: '.sortablelist'
      }).on('sortdrop', function (e, o) {
        var after = this.$(e.currentTarget).children('li')[o.targetIndex];
        this.$(o.item).insertAfter(after);
        this.$('ul').sortable('destroy').sortable({ connectWith: '.sortablelist' });
      }.bind(this));
      */

      var sortable = require('sortable');

      sortable(this.$('ul'), {
        forcePlaceholderSize: true,
        connectWith: '.sortablelist'
      });

    },

    switchToSettings: function() {
      if (this.$('#include ul li').size() > 0) {
        this.store('fields',_.map(this.$('#include ul li'), function(field, index){ return Number(field.id); }));
      }

      this.switchTo('settings', {
        filename: this.store('filename') || 'export',
        fd: this.fd.map(function(del) {
          return {
            name: del.name + ' [' + del.value + ']',
            value: del.value,
            selected: del.value === this.store('field_delimiter') ? 'selected' : '',
          };
        }, this),
        td: this.td.map(function(del) {
          return {
            name: del.name + ' [' + del.value + ']',
            value: del.value,
            selected: del.value === this.store('text_delimiter') ? 'selected' : '',
          };
        }, this),
        df: this.df.map(function(format) {
          return {
            name: format.name + ' [' + moment().format(format.value) + ']',
            value: format.value,
            selected: format.value === this.store('date_format') ? 'selected' : '',
          };
        }, this),
        rlb: this.store('remove_line_breaks') ? 'selected' : ''
      });
    },

    downloadFile: function() {
      this.$('.progress').removeClass('active');
      this.$('#download_back').prop('disabled', false);
      this.$('#download_dummy').hide();

      if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1) {
        var csv = "\ufeff" + this.csv,
            data = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csv),
            filename = this.store('filename')+'.csv';
        this.$("#download_safari").attr({'download': filename, 'href': data});
        this.$('#download_safari')[0].click();
        this.$('#download_safari').show();
      } else {
        var blob = new Blob(['\ufeff'+this.csv], {type: "application/csv;charset=utf-8", encoding:"UTF-8"});
        var url = URL.createObjectURL(blob);

        if (navigator.userAgent.indexOf('MSIE ') > -1 || navigator.userAgent.indexOf('Trident') > -1) {
          this.downloadFileIE(blob);
          this.$('#download_ie').show();
        } else {
          this.$('#download').attr('href', url);
          this.$('#download').attr('download', this.store('filename')+'.csv');

          var download = document.createElement('a');
          download.href = url;
          download.download = this.store('filename')+'.csv';
          download.click();
          this.$('#download').show();
        }
      }

      this.$('#message').text(this.I18n.t('export_message', { count: this.records }));

      if(this.estimate === this.records) {
        this.$('#message').append(this.I18n.t('export_success'));
      } else if ((this.estimate/this.records) > 0.99 && (this.estimate/this.records) < 1.01) {
        this.$('#message').append(this.I18n.t('export_warning', { difference: Math.abs(this.estimate-this.records) }));
      } else {
        this.$('#message').append(this.I18n.t('export_error', { expected: this.estimate }));
      }
    },

    downloadFileIE: function(blob) {
      blob = (blob instanceof Blob) ? blob : new Blob(['\ufeff'+this.csv], {type: "application/csv;charset=utf-8", encoding:"UTF-8"});
      navigator.msSaveBlob(blob, this.store('filename')+'.csv');
    },

    loadingMessage: function() {
      this.$('#random').append('<div>' + this.I18n.t('random.' + (Math.floor(Math.random()*9)+1)) + '<div>');
    },

    byString: function(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1');
        s = s.replace(/^\./, '');
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
              if(!o) {
                return;
              }
            } else {
                return;
            }
        }
        return o;
    }
  };
}());
