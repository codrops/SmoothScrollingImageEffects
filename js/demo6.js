/**
* demo6.js
* http://www.codrops.com
*
* Licensed under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
* 
* Copyright 2019, Codrops
* http://www.codrops.com
*/
{
    // helper functions
    const MathUtils = {
        // map number x from range [a, b] to [c, d]
        map: (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c,
        // linear interpolation
        lerp: (a, b, n) => (1 - n) * a + n * b,
        // Random float
        getRandomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
    };

    // body element
    const body = document.body;
    
    // calculate the viewport size
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    // and recalculate on resize
    window.addEventListener('resize', calcWinsize);
    
    // scroll position
    let docScroll;
    // for scroll speed calculation
    let lastScroll;
    let scrollingSpeed = 0;
    // scroll position update function
    const getPageYScroll = () => docScroll = window.pageYOffset || document.documentElement.scrollTop;
    window.addEventListener('scroll', getPageYScroll);

    // Item
    class Item {
        constructor(el) {
            // the .item element
            this.DOM = {el: el};
            // the inner image
            this.DOM.image = this.DOM.el.querySelector('.content__item-img');
            this.DOM.imageWrapper = this.DOM.image.parentNode;
            this.DOM.title = this.DOM.el.querySelector('.content__item-title');
            this.DOM.deco = this.DOM.el.querySelector('.content__item-decobar');
            this.renderedStyles = {
                // here we define which property will change as we scroll the page and the item is inside the viewport
                // in this case we will be:
                // - translating the inner image
                // - translating the item's title, rotating and scaling it down
                // - translating the decobar
                // we interpolate between the previous and current value to achieve a smooth effect
                innerTranslationY: {
                    // interpolated value
                    previous: 0, 
                    // current value
                    current: 0, 
                    // amount to interpolate
                    ease: 0.1,
                    // current value setter
                    setValue: () => {
                        // the maximum value to translate the image is set in a CSS variable (--overflow)
                        const toValue = parseInt(getComputedStyle(this.DOM.image).getPropertyValue('--overflow'), 10);
                        const fromValue = -1 * toValue;
                        return Math.max(Math.min(MathUtils.map(this.props.top - docScroll, winsize.height, -1 * this.props.height, fromValue, toValue), toValue), fromValue);
                    }
                },
                titleTranslationY: {
                    previous: 0, 
                    current: 0, 
                    ease: 0.1,
                    fromValue: Number(MathUtils.getRandomFloat(30,400)),
                    setValue: () => {
                        const fromValue = this.renderedStyles.titleTranslationY.fromValue;
                        const toValue = -1*fromValue;
                        const val = MathUtils.map(this.props.top - docScroll, winsize.height, -1 * this.props.height, fromValue, toValue);
                        return fromValue < 0 ? Math.min(Math.max(val, fromValue), toValue) : Math.max(Math.min(val, fromValue), toValue);
                    }
                },
                titleScale: {
                    previous: 0, 
                    current: 0, 
                    ease: 0.1,
                    setValue: () => {
                        const fromValue = 1;
                        const toValue = 0.6;
                        const val = MathUtils.map(this.props.top - docScroll, winsize.height/2, -1 * this.props.height, fromValue, toValue);
                        return fromValue < 0 ? Math.min(Math.max(val, fromValue), toValue) : Math.max(Math.min(val, fromValue), toValue);
                    }
                },
                titleRotation: {
                    previous: 0, 
                    current: 0, 
                    ease: 0.1,
                    setValue: () => {
                        const fromValue = 0;
                        const toValue = 10;
                        const val = MathUtils.map(this.props.top - docScroll, winsize.height/2, -1 * this.props.height, fromValue, toValue);
                        return Math.max(Math.min(val, toValue), fromValue);
                    }
                },
                decoTranslationY: {
                    previous: 0, 
                    current: 0, 
                    ease: 0.1,
                    setValue: () => {
                        const fromValue = -600;
                        const toValue = 600;
                        const val = MathUtils.map(this.props.top - docScroll, winsize.height, -1 * this.props.height, fromValue, toValue);
                        return Math.min(Math.max(val, fromValue), toValue);
                    }
                }
            };
            // gets the item's height and top (relative to the document)
            this.getSize();
            // set the initial values
            this.update();
            // use the IntersectionObserver API to check when the element is inside the viewport
            // only then the element styles will be updated
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.intersectionRatio > 0;
                    
                    if ( entry.intersectionRatio > 0.5 ) {
                        TweenMax.set(this.DOM.deco, {
                            transformOrigin: '0% 50%'
                        });
                        TweenMax.to(this.DOM.deco, 0.9, {
                            ease: Expo.easeOut,
                            startAt: {opacity: 1, scaleX: 0},
                            scaleX: 1
                        });
                    }
                    else {
                        TweenMax.set(this.DOM.deco, {
                            transformOrigin: '100% 50%'
                        });
                        TweenMax.to(this.DOM.deco, 0.4, {
                            ease: Expo.easeOut,
                            scaleX: 0
                        });
                    }
                });
            }, { 
                threshold: [0,0.5]
            });
            this.observer.observe(this.DOM.el);
            // init/bind events
            this.initEvents();
        }
        update() {
            // sets the initial value (no interpolation)
            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].current = this.renderedStyles[key].previous = this.renderedStyles[key].setValue();
            }
            // apply changes/styles
            this.layout();
        }
        getSize() {
            const rect = this.DOM.el.getBoundingClientRect();
            this.props = {
                // item's height
                height: rect.height,
                // offset top relative to the document
                top: docScroll + rect.top
            }
        }
        initEvents() {
            window.addEventListener('resize', () => this.resize());
        }
        resize() {
            // gets the item's height and top (relative to the document)
            this.getSize();
            // on resize reset sizes and update styles
            this.update();
        }
        render() {
            // update the current and interpolated values
            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].current = this.renderedStyles[key].setValue();
                this.renderedStyles[key].previous = MathUtils.lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].ease);
            }
            
            // and apply changes
            this.layout();
        }
        layout() {
            // translate the image
            this.DOM.image.style.transform = `translate3d(0,${this.renderedStyles.innerTranslationY.previous}px,0)`;
            // translate/scale/rotate the title
            this.DOM.title.style.transform = `scale3d(${this.renderedStyles.titleScale.previous},${this.renderedStyles.titleScale.previous},1) translate3d(0,${this.renderedStyles.titleTranslationY.previous}px,0) rotate3d(0,0,1,${this.renderedStyles.titleRotation.previous}deg)`;
            // translate the deco
            TweenMax.set(this.DOM.deco, {y: this.renderedStyles.decoTranslationY.previous});
        }
    }

    // SmoothScroll
    class SmoothScroll {
        constructor() {
            // the <main> element
            this.DOM = {main: document.querySelector('main')};
            // the scrollable element
            // we translate this element when scrolling (y-axis)
            this.DOM.scrollable = this.DOM.main.querySelector('div[data-scroll]');
            // the items on the page
            this.items = [];
            this.DOM.content = this.DOM.main.querySelector('.content');
            [...this.DOM.content.querySelectorAll('.content__item')].forEach(item => this.items.push(new Item(item)));
            // here we define which property will change as we scroll the page
            // in this case we will be translating on the y-axis
            // we interpolate between the previous and current value to achieve the smooth scrolling effect
            this.renderedStyles = {
                translationY: {
                    // interpolated value
                    previous: 0, 
                    // current value
                    current: 0, 
                    // amount to interpolate
                    ease: 0.1,
                    // current value setter
                    // in this case the value of the translation will be the same like the document scroll
                    setValue: () => docScroll
                },
                skew: {
                    previous: 0, 
                    current: 0, 
                    ease: 0.1,
                    setValue: () => {
                        const toValue = 30;
                        const fromValue = 0;
                        const val = Math.max(Math.min(MathUtils.map(scrollingSpeed, 20, 100, fromValue, toValue), toValue), fromValue)
                        return this.renderedStyles.translationY.previous < docScroll ? val : -1*val;
                    }
                }
            };
            // set the body's height
            this.setSize();
            // set the initial values
            this.update();
            // the <main> element's style needs to be modified
            this.style();
            // init/bind events
            this.initEvents();
            // start the render loop
            requestAnimationFrame(() => this.render());
        }
        update() {
            // sets the initial value (no interpolation) - translate the scroll value
            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].current = this.renderedStyles[key].previous = this.renderedStyles[key].setValue();   
            }   
            // translate the scrollable element
            this.layout();
        }
        layout() {
            this.DOM.scrollable.style.transform = `translate3d(0,${-1*this.renderedStyles.translationY.previous}px,0) skewY(${this.renderedStyles.skew.previous}deg)`;
        }
        setSize() {
            // set the heigh of the body in order to keep the scrollbar on the page
            body.style.height = `${this.DOM.scrollable.scrollHeight}px`;
        }
        style() {
            // the <main> needs to "stick" to the screen and not scroll
            // for that we set it to position fixed and overflow hidden 
            this.DOM.main.style.position = 'fixed';
            this.DOM.main.style.width = this.DOM.main.style.height = '100%';
            this.DOM.main.style.top = this.DOM.main.style.left = 0;
            this.DOM.main.style.overflow = 'hidden';
        }
        initEvents() {
            // on resize reset the body's height
            window.addEventListener('resize', () => this.setSize());
        }
        render() {
            // Get scrolling speed
            // Update lastScroll
            scrollingSpeed = Math.abs(docScroll - lastScroll);
            lastScroll = docScroll;
            
            // update the current and interpolated values
            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].current = this.renderedStyles[key].setValue();
                this.renderedStyles[key].previous = MathUtils.lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].ease);    
            }
            // and translate the scrollable element
            this.layout();
            
            // for every item
            for (const item of this.items) {
                // if the item is inside the viewport call it's render function
                // this will update item's styles, based on the document scroll value and the item's position on the viewport
                if ( item.isVisible ) {
                    if ( item.insideViewport ) {
                        item.render();
                    }
                    else {
                        item.insideViewport = true;
                        item.update();
                    }
                }
                else {
                    item.insideViewport = false;
                }
            }
            
            // loop..
            requestAnimationFrame(() => this.render());
        }
    }

    /***********************************/
    /********** Preload stuff **********/

    // Preload images
    const preloadImages = () => {
        return new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.content__item-img'), {background: true}, resolve);
        });
    };
    
    // And then..
    preloadImages().then(() => {
        // Remove the loader
        document.body.classList.remove('loading');
        // Get the scroll position and update the lastScroll variable
        getPageYScroll();
        lastScroll = docScroll;
        // Initialize the Smooth Scrolling
        new SmoothScroll();
    });
}