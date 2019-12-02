(function($){
	$(document).on('click','.tag-filter',function(){
	  var $this = $(this);
	  $('span.tag-filter').removeClass("active");
	  $this.addClass("active");
	  $('.tag-group').children().each(function(){
	    if($(this).data('tag') ==  $this.data('tag')){
	      $(this).addClass("active");
	    }
	  });
	  if( $(this).hasClass('all')){
	    $('.project-item').showAll();
	  }else{
	    $('.project-item').filterTags($(this).data('tag'));
	  }
	});
	$.fn.extend({
	  filterTags: function(tagName) {
	    this.removeClass('not-show');
	    return this.each(function(){
	      var itemTagArray = JSON.parse($(this).attr('data-tags'));
	      if($.inArray(tagName, itemTagArray) === -1){
	        $(this).addClass('not-show');
	      }
	    });
	  },
	  showAll: function(){
	    return this.each(function() {
	      if($(this).hasClass('not-show')){
	        $(this).removeClass('not-show');
	      }
	    });
	  }
	});
// 点击图片放大
	var $cover = $('#cover');
	var $input = $('.coverinput input');
	var $inputWrap = $('.coverinput');
	function zoom(){
		var w_w = $(window).width();
		var w_h = $(window).height();	
		$(document).off().on('click', '.post p img', function(e){
			e.preventDefault();
			var $this = $(this);
			var _$clone = $this.clone();
			_$clone.css({
					position: 'relative',
					width: $this.width()*1.5 + 'px'
				});
			$cover.find('div.wrap').css({
				lineHeight: w_h*0.8 + 'px'
			}).prepend(_$clone).end().fadeIn(200)
			// 将图片放大, 直到其大于
			if($this.width()*2 <= w_w*0.8){
				$inputWrap.show();
				$input.on('input', function(){
					$cover.find('img').width($(this).val()*$this.width());
				});
			}else{
				$inputWrap.hide();
			}
		});
	}
	$(window).resize(function(){
		zoom();
	});
	zoom();
	// 关闭图片
	$('#cover i').on('click', function(e){
		$input.val('1.5');
		$('#cover img').remove();
		$cover.fadeOut(200);
	})
})(jQuery);