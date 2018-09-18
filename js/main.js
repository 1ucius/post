jQuery(document).ready(function ($) {

    //cors: https://cors-anywhere.herokuapp.com/

    $('#comments-section').load('./templates/comments-content.html', function() {

        var commentsSection = document.getElementById('comments'),
            commentsCounter = document.getElementById('comments-counter'),
            commentsCount   = 0,
            commentsOffset  = 0,
            userImage       = document.getElementById('user-avatar'),
            baseURL         ='https://cors-anywhere.herokuapp.com/http://frontend-test.pingbull.com/pages/vadim.orlov.workmail@gmail.com/comments',
            user;


        function closest(el, selector) {
            var matchesFn;
        
            // find vendor prefix
            ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
                if (typeof document.body[fn] == 'function') {
                    matchesFn = fn;
                    return true;
                };
                return false;
            });
        
            var parent;
        
            // traverse parents
            while (el) {
                parent = el.parentElement;
                if (parent && parent[matchesFn](selector)) {
                    return parent;
                };
                el = parent;
            };
        
            return null;
        }


        function getDate(string) {

            var date = new Object();
                s = string.toLowerCase();

            date.d = s.substring(0, s.indexOf('t'));
            date.t = s.substring(s.indexOf("t") + 1, s.lastIndexOf(":"));

            return date;

        }


        window.countComments = function(data) {

            for(var i=0, l=data.length; i<l; i++) {
                commentsCount += 1 + (data[i].children.length || 0);
            }
            commentsCounter.innerHTML = commentsCount + ' comments';

        }


        function createComment(data, addressee, reply) {

            var date = getDate(data.created_at);

            var navigation = '';

            if (data.author.id === user.id) {

                navigation += 
                    '<div class="comment__navigation clearfix flex">' +
                        '<button class="comment__nav-button comment__nav-button_edit stag-book small-font" data-action="edit" onclick="replyForm.dislocate(this)">Edit</button> ' +
                        '<button class="comment__nav-button comment__nav-button_delete stag-book small-font" data-action="delete" onclick="deleteComment(this)">Delete</button> ' +
                        (reply === false ? '<button class="comment__nav-button comment__nav-button_reply stag-book small-font" data-action="reply" onclick="replyForm.dislocate(this)">Reply</button> ' : ' ') +
                    '</div> '

            } else if (reply === false) {

                navigation += 
                    '<div class="comment__navigation clearfix flex">' +
                        '<button class="comment__nav-button comment__nav-button_reply stag-book small-font" data-action="reply" onclick="replyForm.dislocate(this)">Reply</button> ' +
                    '</div> '

            }
                
            var html = document.createElement('div');
                html.classList = 'comment' + (reply ? ' comment_reply' : ' comment_parent');
                html.setAttribute('data-user-id', data.author.id);
                html.setAttribute('id', data.id);

                html.innerHTML = 
               
                    '<div class="avatar border border_narrow rounded' + (reply ? ' avatar_small' : '') + '">' +
                        '<img class="block rounded" src="' + data.author.avatar + '"> ' +
                    '</div> ' +
                    '<div class="comment__wrapper">' +
                        '<ul class="info info_comment">' +
                            '<li class="info__item info__item_author">' +
                                '<p class="info__author-name stag-medium medium-font">' + data.author.name + '</p> ' +
                            '</li> ' +

                            (reply ? 
                                '<li class="info__item info__item_addressee">' +
                                    '<div class="info__icon">' +
                                        '<img src="./img/addressee.png" alt="icon">' +
                                    '</div> ' +
                                    '<p class="info__addressee-name stag-book small-font">' + addressee + '</p> ' +
                                '</li> ' 
                            
                            : '') +

                            '<li class="info__item info__item_date small-font">' +
                                '<div class="info__icon">' +
                                    '<img src="./img/clock.png" alt="icon">' +
                                '</div> ' +
                                '<time class="stag-medium">' + date.d + ' </time> ' +
                                '<p class="stag-book"> '+ 'at' + '</p> ' +
                                '<time class="stag-medium"> ' + date.t + '</time> ' +
                            '</li> ' +
                        '</ul> ' +
                        '<p class="comment__message medium-font stag-book">' + data.content + '</p> ' +
                        navigation +
                    '</div> ' +
                    '<div class="comment__reply" id="reply-' + data.id + '"></div> '+
                    '<div class="comment__replies"></div>';

            return html;
        }


        function createComments(data) {

            for (var i=0, l=data.length; i<l; i++) {

                var ref = createComment(data[i], false, false);
                commentsSection.append(ref);

                if (data[i].children.length) {

                    var replies = ref.querySelector('.comment__replies');

                    for (var j=0, k=data[i].children.length; j<k; j++) {
                        replies.append(createComment(data[i].children[j], data[i].author.name, true));
                    }

                }

            }

        }


        window.startSetup = function(data) {

            commentsOffset += data.length;
    
            user = {
                id:     data[0].author.id,
                name:   data[0].author.name,
                avatar: data[0].author.avatar
            }

            userImage.src = user.avatar;
            createComments(data);

        }

        
        function makeAjax(type, url, method, params, callback, stop) {

            $.ajax({
                url: baseURL + url,
                type: type,
                data: params
            }).done(function(data) {
                
                if (callback && typeof callback == 'string' && type != 'DELETE' && method != 'DELETE') window[callback](data);
                if (type === 'DELETE' || type === 'POST' && method === 'DELETE') {
                    document.getElementById(callback).parentNode.removeChild(document.getElementById(callback));
                    commentsCounter.innerHTML = parseInt(commentsCounter.innerHTML) - 1 + ' comments';
                } 
        
            }).fail(function(jqXHR, textStatus) {
                if (stop) return false;
                method = type = 'PUT' ? 'PUT' : 'DELETE';
                params._method = method;
                type = 'POST';
                makeAjax(type, url, method, params, callback, true);
            });

        }


        makeAjax('GET', '', false, {count: 5, offset: commentsOffset}, 'startSetup', false);
        makeAjax('GET', '', false, {offset: 0, count: 0}, 'countComments', false);

        function form(el) {

            if (el.getAttribute('id') === 'respond-form') {

                
                this.el        = el.cloneNode(true);
                this.addressee = this.el.querySelector('#addressee');
                this.close     = this.el.querySelector('#close');


                this.setParams = function(ref, action) {


                    this.action           = ref.getAttribute('data-action');
                    this.comment          = closest(ref, '.comment');
                    this.ref              = this.comment.querySelector('.comment__reply');
                    this.parent           = closest(this.ref, '.comment.comment_parent')
                    this.addressee_name   = this.parent.querySelector('.info__author-name').textContent;
                    this.addressee_id     = this.parent.getAttribute('id');


                }.bind(this);


                this.dislocate = function(ref) {


                    this.formReset();
                    this.setParams(ref);
                    this.addressee.innerHTML = this.addressee_name;
                    if (this.action === 'edit') this.input.value = this.comment.querySelector('.comment__message').textContent;
                    this.ref.appendChild(this.el);
                    

                }.bind(this);

                this.formReset = function() {

                    this.input.value = this.addressee.innerHTML = '';
                    this.processStatus(false, false);

                }.bind(this);

                this.close.onclick = function() {

                    if (this.ref) this.ref.removeChild(this.el);
                    this.formReset();

                }.bind(this);


            } else {
                this.el = el;
                this.action = 'post';
            }


            this.input    = this.el.querySelector('.comment-form__input');
            this.button   = this.el.querySelector('.comment-form__button');
            this.error    = this.el.querySelector('.comment-form__error');
            this.success  = this.el.querySelector('.comment-form__success');


            this.button.onclick = function(e) {
                e.preventDefault();

                if (this.validateInput(this.input.value)) {

                    if (this.action === 'post') {
                        makeAjax('POST', '', false, {content: this.input.value, parent: null}, 'successfulPost', false);
                    } else if (this.action === 'edit') {
                        makeAjax('PUT', '/' + closest(this.el, '.comment').getAttribute('id'), false, {content: this.input.value}, 'successfulEdit', false);
                    } else if (this.action === 'reply') {
                        makeAjax('POST', '' , false, {content: this.input.value, parent: closest(this.el, '.comment').getAttribute('id')}, 'successfulReply', false);
                    }

                } else {

                    this.processStatus(true, false, 'Please, type your message and click "Send"!')

                }

            }.bind(this);

        }


        form.prototype.validateInput = function(string) {

            if (string.length) return true;
            return false;

        }


        form.prototype.processStatus = function(error, success, message) {


            if (error) {

                this.error.innerHTML = message;
                this.success.classList.remove('comment-form__success_active');
                this.error.classList.add('comment-form__error_active');

            } else if (success) {

                this.success.innerHTML = message;
                this.error.classList.remove('comment-form__error_active');
                this.success.classList.add('comment-form__success_active');
                setTimeout(function() {
                    this.success.classList.remove('comment-form__success_active');
                }.bind(this), 2000);

            } else {

                this.error.classList.remove('comment-form__error_active');
                this.success.classList.remove('comment-form__success_active');

            }


        }


        window.replyForm = new form(document.getElementById('respond-form').cloneNode(true));
        window.commentForm = new form(document.getElementById('comment-form'));


        window.deleteOverlay = {
            el: document.getElementById('delete-overlay').cloneNode(true)
        }


        document.getElementById('comments-section').removeChild(document.getElementById('form-container'));


        deleteOverlay.accept = deleteOverlay.el.querySelector('#accept');
        deleteOverlay.abort = deleteOverlay.el.querySelector('#abort');


        deleteOverlay.accept.onclick = function() {
            var id = closest(deleteOverlay.el, '.comment').getAttribute('id');
            makeAjax('DELETE', '/' + id, false, {}, id, false);
        }


        deleteOverlay.abort.onclick = function() {
            closest(deleteOverlay.el, '.comment').querySelector('.comment__wrapper').removeChild(deleteOverlay.el);
        }


        window.successfulPost = function(data) {
            commentForm.input.value = '';
            document.getElementById('comments').insertBefore(createComment(data, false, false), document.getElementById('comments').firstChild);
            commentsCounter.innerHTML = parseInt(commentsCounter.innerHTML) + 1 + ' comments';
            commentForm.processStatus(false, true, 'Your message has been succesfully added:)');
        }


        window.successfulEdit = function(data) {

            document.getElementById(data.id).querySelector('.comment__message').innerHTML = data.content;
            replyForm.processStatus(false, true, 'Changed successfully!');
            setTimeout(function() {
                replyForm.ref.removeChild(replyForm.el);
            }, 2000);
            
        }


        window.successfulReply = function(data) {

            var comment = createComment(data, replyForm.addressee_name, true);
            replyForm.parent.querySelector('.comment__replies').append(comment);
            replyForm.processStatus(false, true, 'Your answer has been added!');
            commentsCounter.innerHTML = parseInt(commentsCounter.innerHTML) + 1 + ' comments';
            setTimeout(function() {
                replyForm.ref.removeChild(replyForm.el);
            }, 2000);

        }


        window.deleteComment = function(el) {
            closest(el, '.comment').querySelector('.comment__wrapper').appendChild(deleteOverlay.el);
        }


        window.loadComments = function(data) {

            if (data.length) {
                if (data.length<4) {
                    loadMore.innerHTML = 'no more comments';
                    loadMore.onclick = null;
                    loadMore.setAttribute('disabled', 'true');
                }
                commentsOffset += data.length;
                createComments(data);
            } else {
                loadMore.innerHTML = 'no more comments';
                loadMore.onclick = null;
                loadMore.setAttribute('disabled', 'true');
            }

        }


        var loadMore = document.getElementById('load-more');
        loadMore.onclick = function() { 
            makeAjax('GET', '', false, {count: 5, offset: commentsOffset}, 'loadComments', false); 
        }


        var overlays = document.querySelectorAll('.post__content-image'),
            zoom     = document.getElementById('image-zoom'),
            zoom_img = document.getElementById('zoom-img');

        for (var i=0, l=overlays.length; i<l; i++) {
            overlays[i].onclick = function(e) {
                zoom_img.src = this.querySelector('img').getAttribute('src');
                zoom.classList.add('active');
                document.querySelector('html').classList.add('noscroll');
            }
        }

        zoom.onclick = function() {
            this.classList.remove('active');
            document.querySelector('html').classList.remove('noscroll');
        }


    });


});
