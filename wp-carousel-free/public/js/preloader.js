;(function ($) {
    'use strict'

    /**
     * Remove the preloader of every carousel that is already in the document
     * and fade the carousel in.
     *
     * Exposed globally because the block editor canvas is an iframe since
     * WordPress 6.3 and its markup is rendered after this file has run.
     */
    function SPCarouselFreePreloader() {
        jQuery('body').find('.wpcp-carousel-section.wpcp-preloader').each(function () {
            var carousel_id         = $(this).attr('id'),
                parents_class       = jQuery('#' + carousel_id).parents('.wpcp-carousel-wrapper'),
                parents_siblings_id = parents_class.find('.wpcp-carousel-preloader').attr('id');
          // jQuery(window).on('load', function() {
            jQuery('#' + parents_siblings_id).animate({ opacity: 0 }, 600).remove();
            jQuery('#' + carousel_id).animate({ opacity: 1 }, 600)
          // })
        })
    }

    window.spWPCarouselFreePreloader = SPCarouselFreePreloader;

    SPCarouselFreePreloader();
})(jQuery)
