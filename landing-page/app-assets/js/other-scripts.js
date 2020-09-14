$( "#cookieAccept" ).click(function() {
  $.cookie('cookieAccepted', 'true', { path: '/', expires : 365 });	
	$('.cookie-message').addClass('d-none');
});
if ($.cookie("cookieAccepted") !== 'true') {
	$('.cookie-message').removeClass('d-none');
}



	$('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
      && 
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top - 104
        }, 640, function() {
          // Callback after animation
          // Must change focus!
          var $target = $(target);
          $target.find('.required.email').focus();
        });
      }
      
    }
  });

$(function() {
   $(window).scroll(function() {
      //ADD CLASS
      if ($(".navbar").offset().top > 64) {
         $(".fixed-top").addClass("shadow");
      } else {
         $(".fixed-top").removeClass("shadow");
      }
   });
});


window.fnames = new Array(); window.ftypes = new Array();fnames[0]='EMAIL';ftypes[0]='email';fnames[3]='MMERGE3';ftypes[3]='text';fnames[5]='MMERGE5';ftypes[5]='text';fnames[8]='MMERGE8';ftypes[8]='dropdown';fnames[4]='PHONE';ftypes[4]='phone';fnames[7]='MMERGE7';ftypes[7]='radio';fnames[1]='MMERGE1';ftypes[1]='radio';
				
	var mc1Submitted = false;
	$('#mc-embedded-subscribe-form').on('submit reset', function (event) {
		 if ("submit" === event.type) {
		 	mc1Submitted = true;
		 } else if ( "reset" === event.type && mc1Submitted ) {
		 	$('.email-sign-up, .form-text').addClass('d-none');
		 }
	});
