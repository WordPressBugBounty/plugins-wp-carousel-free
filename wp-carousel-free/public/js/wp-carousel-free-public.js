(function ($) {
    'use strict';

    /**
     * Swap lazy images in and around the visible slides, as Swiper 8's Lazy module did.
     */
    function wpcpLoadLazyImages(swiper) {
        var slidesPerView = 'auto' === swiper.params.slidesPerView ? 1 : Math.max(1, Math.ceil(swiper.params.slidesPerView));
        var count = swiper.slides.length;
        var first = swiper.activeIndex - slidesPerView;
        var last = swiper.activeIndex + slidesPerView * 2;

        // In loop mode the slides before the first one sit at the end of the wrapper.
        if (!swiper.params.loop) {
            first = Math.max(first, 0);
            last = Math.min(last, count);
        }

        for (var i = first; i < last; i++) {
            $(swiper.slides[((i % count) + count) % count]).find('img.swiper-lazy[data-src]').not('.swiper-lazy-loading, .swiper-lazy-loaded').each(function () {
                var $image = $(this);
                var src = $image.attr('data-src');
                var loader = new Image();

                $image.addClass('swiper-lazy-loading');
                loader.onload = loader.onerror = function () {
                    $image.attr('src', src).removeAttr('data-src').addClass('swiper-lazy-loaded').removeClass('swiper-lazy-loading');
                };
                loader.src = src;
            });
        }
    }

    /**
     * How many copies of the slides Swiper 12's loop needs at the widest breakpoint.
     *
     * Swiper 8 duplicated slides itself, so a loop worked at any slide count;
     * Swiper 12 needs ceil(slidesPerView), plus one when centred and even, plus
     * one more, or half that rounded up when centred.
     */
    function wpcpLoopCopies(SwiperCtor, data, slideCount) {
        // Swiper 8 and older, loaded by a theme, still duplicate slides themselves.
        if (!data.infinite || !slideCount || (SwiperCtor.defaults && 'loopFillGroupWithBlank' in SwiperCtor.defaults)) {
            return 1;
        }
        var needed = 0;
        $.each(data.slidesToShow, function (device, slidesToShow) {
            var minimumSlides = Math.ceil(slidesToShow);
            if (data.centerMode && minimumSlides % 2 === 0) {
                minimumSlides += 1;
            }
            needed = Math.max(needed, minimumSlides + (data.centerMode ? Math.ceil(minimumSlides / 2) : 1));
        });

        return Math.max(1, Math.ceil(needed / slideCount));
    }

    /**
     * Append copies of the slides, marked as Swiper 8 marked its duplicates.
     */
    function wpcpCloneSlides($wrapper, copies) {
        var $slides = $wrapper.children('.swiper-slide');
        for (var copy = 1; copy < copies; copy++) {
            $slides.each(function (index) {
                $(this).clone().addClass('swiper-slide-duplicate').attr('data-wpcp-original', index).appendTo($wrapper);
            });
        }
    }

    /**
     * Keep bullets, slide labels and the lightbox at the real slide count while copies fill the loop.
     */
    function wpcpCountOriginalSlides(swiper, slideCount, carouselId) {
        var busy = false;

        // Run Swiper's own pagination code as if only the original slides existed.
        function asOriginals(method) {
            if (busy || !swiper.pagination || 'function' !== typeof swiper.pagination[method]) {
                return;
            }
            var slides = swiper.slides;
            var realIndex = swiper.realIndex;
            var previousRealIndex = swiper.previousRealIndex;
            busy = true;
            swiper.slides = slides.slice(0, slideCount);
            swiper.realIndex = realIndex % slideCount;
            swiper.previousRealIndex = (previousRealIndex || 0) % slideCount;
            try {
                swiper.pagination[method]();
                if ('render' === method) {
                    swiper.pagination.update();
                }
            } finally {
                swiper.slides = slides;
                swiper.realIndex = realIndex;
                swiper.previousRealIndex = previousRealIndex;
                busy = false;
            }
        }

        function labelSlides() {
            var a11y = swiper.params.a11y;
            if (!a11y || !a11y.enabled || !a11y.slideLabelMessage) {
                return;
            }
            swiper.slides.forEach(function (slide) {
                var index = parseInt(slide.getAttribute('data-swiper-slide-index'), 10) % slideCount;
                slide.setAttribute('aria-label', a11y.slideLabelMessage.replace(/\{\{index\}\}/, index + 1).replace(/\{\{slidesLength\}\}/, slideCount));
            });
        }

        swiper.on('paginationRender', function () {
            asOriginals('render');
        });
        swiper.on('paginationUpdate', function () {
            asOriginals('update');
        });
        swiper.on('slidesLengthChange snapGridLengthChange slidesGridLengthChange', labelSlides);
        asOriginals('render');
        labelSlides();

        // A copy's lightbox link opens the original, so the gallery holds each image once.
        $('#' + carouselId).on('click', '.swiper-slide-duplicate [data-fancybox]', function (event) {
            var original = $(this).closest('.swiper-slide-duplicate').attr('data-wpcp-original');
            var $link = $('#' + carouselId + ' .swiper-slide:not(.swiper-slide-duplicate)').eq(original).find('[data-fancybox]').first();
            if ($link.length) {
                event.preventDefault();
                event.stopImmediatePropagation();
                $link.trigger('click');
            }
        });
    }

    function SPCarouselFreeInit() {
        var SwiperCtor = window.WPCPSwiper || window.Swiper;

        jQuery('body').find('.wpcp-carousel-section.wpcp-standard').not('.swiper-initialized').each(function () {

            var carousel_id = $(this).attr('id');
            var _this = $(this);
            var wpcpSwiperData = $('#' + carousel_id).data('swiper');

            if (wpcpSwiperData.effect == 'flip') {
                /**
                * Apply fade effect to slides
                * @param {number} slidesToShow - Number of slides to show
                */
                function fade_effect(slidesToShow) {
                    var fade_items = $(`#${carousel_id} .swiper-wrapper >.single-item-fade`);
                    // Group slides.
                    for (var i = 0; i < fade_items.length; i += slidesToShow) {
                        fade_items.slice(i, i + slidesToShow).wrapAll('<div class="swiper-slide"><div class="swiper-slide-kenburn"></div></div>');
                    }
                    // Fix fade last item small issue if row or column does not fill
                    $(`#${carousel_id} .swiper-slide-kenburn`).each(function () {
                        var empty_items = slidesToShow - $(this).find('.single-item-fade').length
                        if (empty_items > 0) {
                            for (let i = 0; i < empty_items; i++) {
                                $(this).append(`<div class="single-item-fade" style="width:${100 / slidesToShow}%;"></div>`);
                            }
                        }
                    });
                    $(fade_items).css('width', `${100 / slidesToShow}%`);

                    // $carousel_items = $(`#${carousel_id}`).find('.single-item-fade').length;
                }
                // Apply fade effect based on screen size.
                if ($(window).width() > wpcpSwiperData.responsive.desktop) {
                    fade_effect(wpcpSwiperData.slidesToShow.lg_desktop);
                } else if ($(window).width() > wpcpSwiperData.responsive.laptop) {
                    fade_effect(wpcpSwiperData.slidesToShow.desktop);
                } else if ($(window).width() > wpcpSwiperData.responsive.tablet) {
                    fade_effect(wpcpSwiperData.slidesToShow.laptop);
                } else if ($(window).width() > wpcpSwiperData.responsive.mobile) {
                    fade_effect(wpcpSwiperData.slidesToShow.tablet);
                } else if ($(window).width() > 0) {
                    fade_effect(wpcpSwiperData.slidesToShow.mobile);
                }
                wpcpSwiperData.slidesToShow.mobile = 1;
                wpcpSwiperData.slidesToShow.tablet = 1;
                wpcpSwiperData.slidesToShow.desktop = 1;
                wpcpSwiperData.slidesToShow.laptop = 1;
                wpcpSwiperData.slidesToShow.lg_desktop = 1;
            }
            var slideCount = $('#' + carousel_id + ' .swiper-wrapper > .swiper-slide').length;
            var loopCopies = wpcpLoopCopies(SwiperCtor, wpcpSwiperData, slideCount);
            if (loopCopies > 1) {
                wpcpCloneSlides($('#' + carousel_id + ' .swiper-wrapper'), loopCopies);
            }
            var wpcpSwiper = new SwiperCtor('#' + carousel_id + ':not(.swiper-initialized, .swiper-container-initialized)', {
                // Optional parameters
                autoplay: wpcpSwiperData.autoplay ? ({
                    delay: wpcpSwiperData.autoplaySpeed, disableOnInteraction: false,
                }) : false,
                speed: wpcpSwiperData.speed,
                effect: wpcpSwiperData.effect,
                centeredSlides: wpcpSwiperData.centerMode,
                // slidesPerGroup: 1,
                slidesPerView: wpcpSwiperData.slidesToShow.mobile,
                simulateTouch: wpcpSwiperData.draggable,
                loop: wpcpSwiperData.infinite,
                loopAddBlankSlides: false,
                allowTouchMove: wpcpSwiperData.swipe,
                spaceBetween: wpcpSwiperData.spaceBetween,
                freeMode: wpcpSwiperData.freeMode,
                grabCursor: true,
                preloadImages: ('false' !== wpcpSwiperData.lazyLoad) ? true : false,
                lazy: {
                    loadPrevNext: ('false' !== wpcpSwiperData.lazyLoad) ? true : false,
                    loadPrevNextAmount: 1
                },

                // Responsive breakpoints
                breakpoints: {
                    // when window width is >= 480px
                    [wpcpSwiperData.responsive.mobile]: {
                        slidesPerView: wpcpSwiperData.slidesToShow.tablet,
                    },
                    // when window width is >= 736px
                    [wpcpSwiperData.responsive.tablet]: {
                        slidesPerView: wpcpSwiperData.slidesToShow.laptop,
                    },
                    // when window width is >= 980px
                    [wpcpSwiperData.responsive.laptop]: {
                        slidesPerView: wpcpSwiperData.slidesToShow.desktop,
                    },
                    [wpcpSwiperData.responsive.desktop]: {
                        slidesPerView: wpcpSwiperData.slidesToShow.lg_desktop,
                    }
                },

                // If we need pagination
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: 'dynamic' == wpcpSwiperData.pagination_type ? true : false,
                },
                a11y: wpcpSwiperData.accessibility ? ({
                    prevSlideMessage: 'Previous slide',
                    nextSlideMessage: 'Next slide',
                }) : false,

                // Navigation arrows
                navigation: {
                    nextEl: '#' + carousel_id + ' .swiper-button-next',
                    prevEl: '#' + carousel_id + ' .swiper-button-prev',
                    addIcons: false,
                },
                on: {
                    'afterInit loopFix transitionEnd resize breakpoint _freeModeNoMomentumRelease _freeModeStaticRelease': function () {
                        if ('false' !== wpcpSwiperData.lazyLoad) {
                            wpcpLoadLazyImages(this);
                        }
                    },
                },
            });
            if (loopCopies > 1) {
                wpcpCountOriginalSlides(wpcpSwiper, slideCount, carousel_id);
            }

            // On hover stop.
            if (wpcpSwiperData.pauseOnHover && wpcpSwiperData.autoplay) {
                $('#' + carousel_id).on({
                    mouseenter: function () {
                        wpcpSwiper.autoplay.stop();
                    },
                    mouseleave: function () {
                        wpcpSwiper.autoplay.start();
                    }
                });
            }
        });

        jQuery(document).find('.wpcp-carousel-wrapper').addClass('wpcp-loaded');
    }

    /**
     * Expose the initializer globally.
     *
     * The block editor canvas is an iframe since WordPress 6.3, so the editor
     * has to be able to run the initializer on the window that owns the
     * markup instead of re-downloading this file into the wrong document.
     */
    window.spWPCarouselFreeInit = SPCarouselFreeInit;

    // Initialize the carousel when the document is ready
    $(document).ready(function () {
        SPCarouselFreeInit();
    });

    // Register the handler with Elementor's frontend event.
    $(window).on('elementor/frontend/init', function () {
        elementorFrontend.hooks.addAction('frontend/element_ready/sp_wp_carousel_shortcode.default', SPCarouselFreeInit);
    });
})(jQuery);