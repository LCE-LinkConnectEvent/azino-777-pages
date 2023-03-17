
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Preloader/Preloader.svelte generated by Svelte v3.50.1 */

    const file$r = "src/components/Preloader/Preloader.svelte";

    function create_fragment$s(ctx) {
    	let section;
    	let div;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			attr_dev(div, "class", "preloader preloader__big svelte-o82wnf");
    			add_location(div, file$r, 1, 4, 39);
    			attr_dev(section, "class", "preloader-screen svelte-o82wnf");
    			add_location(section, file$r, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Preloader', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Preloader> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Preloader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Preloader",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    const padNumber = (number) => number <= 9 ? `0${number}` : `${number}`;

    /* src/components/common/Timer.svelte generated by Svelte v3.50.1 */
    const file$q = "src/components/common/Timer.svelte";

    // (35:2) {#if showDays}
    function create_if_block_4$1(ctx) {
    	let span0;
    	let t0_value = padNumber(/*d*/ ctx[5]) + "";
    	let t0;
    	let t1;
    	let t2;
    	let span1;
    	let if_block = /*showLabels*/ ctx[0] && create_if_block_5$1(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = ":";
    			attr_dev(span0, "class", "countdown__days");
    			add_location(span0, file$q, 35, 4, 850);
    			attr_dev(span1, "class", "countdown__delimiter");
    			add_location(span1, file$q, 41, 4, 1001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			if (if_block) if_block.m(span0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*d*/ 32 && t0_value !== (t0_value = padNumber(/*d*/ ctx[5]) + "")) set_data_dev(t0, t0_value);

    			if (/*showLabels*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block_5$1(ctx);
    					if_block.c();
    					if_block.m(span0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(35:2) {#if showDays}",
    		ctx
    	});

    	return block;
    }

    // (38:6) {#if showLabels}
    function create_if_block_5$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "д";
    			attr_dev(span, "class", "countdown__label");
    			add_location(span, file$q, 38, 8, 933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(38:6) {#if showLabels}",
    		ctx
    	});

    	return block;
    }

    // (46:4) {#if showLabels}
    function create_if_block_3$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "ч";
    			attr_dev(span, "class", "countdown__label");
    			add_location(span, file$q, 46, 6, 1133);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(46:4) {#if showLabels}",
    		ctx
    	});

    	return block;
    }

    // (53:4) {#if showLabels}
    function create_if_block_2$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "м";
    			attr_dev(span, "class", "countdown__label");
    			add_location(span, file$q, 53, 6, 1321);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(53:4) {#if showLabels}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if showSeconds}
    function create_if_block$9(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t2_value = padNumber(/*s*/ ctx[6]) + "";
    	let t2;
    	let t3;
    	let if_block = /*showLabels*/ ctx[0] && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = ":";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "countdown__delimiter");
    			add_location(span0, file$q, 58, 4, 1406);
    			attr_dev(span1, "class", "countdown__seconds");
    			add_location(span1, file$q, 59, 4, 1454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			if (if_block) if_block.m(span1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*s*/ 64 && t2_value !== (t2_value = padNumber(/*s*/ ctx[6]) + "")) set_data_dev(t2, t2_value);

    			if (/*showLabels*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(58:2) {#if showSeconds}",
    		ctx
    	});

    	return block;
    }

    // (62:6) {#if showLabels}
    function create_if_block_1$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "c";
    			attr_dev(span, "class", "countdown__label");
    			add_location(span, file$q, 62, 8, 1540);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(62:6) {#if showLabels}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div;
    	let t0;
    	let span0;
    	let t1_value = padNumber(/*h*/ ctx[4]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let t6_value = padNumber(/*m*/ ctx[3]) + "";
    	let t6;
    	let t7;
    	let t8;
    	let if_block0 = /*showDays*/ ctx[1] && create_if_block_4$1(ctx);
    	let if_block1 = /*showLabels*/ ctx[0] && create_if_block_3$1(ctx);
    	let if_block2 = /*showLabels*/ ctx[0] && create_if_block_2$3(ctx);
    	let if_block3 = /*showSeconds*/ ctx[2] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = ":";
    			t5 = space();
    			span2 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(span0, "class", "countdown__hours");
    			add_location(span0, file$q, 43, 2, 1055);
    			attr_dev(span1, "class", "countdown__delimiter");
    			add_location(span1, file$q, 49, 2, 1195);
    			attr_dev(span2, "class", "countdown__minutes");
    			add_location(span2, file$q, 50, 2, 1241);
    			attr_dev(div, "class", "countdown");
    			add_location(div, file$q, 33, 0, 805);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span0);
    			append_dev(span0, t1);
    			append_dev(span0, t2);
    			if (if_block1) if_block1.m(span0, null);
    			append_dev(div, t3);
    			append_dev(div, span1);
    			append_dev(div, t5);
    			append_dev(div, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			if (if_block2) if_block2.m(span2, null);
    			append_dev(div, t8);
    			if (if_block3) if_block3.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showDays*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*h*/ 16 && t1_value !== (t1_value = padNumber(/*h*/ ctx[4]) + "")) set_data_dev(t1, t1_value);

    			if (/*showLabels*/ ctx[0]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					if_block1.m(span0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*m*/ 8 && t6_value !== (t6_value = padNumber(/*m*/ ctx[3]) + "")) set_data_dev(t6, t6_value);

    			if (/*showLabels*/ ctx[0]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_2$3(ctx);
    					if_block2.c();
    					if_block2.m(span2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*showSeconds*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$9(ctx);
    					if_block3.c();
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let d;
    	let h;
    	let m;
    	let s;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timer', slots, []);
    	const dispatch = createEventDispatcher();
    	let { seconds } = $$props;
    	let { showLabels = false } = $$props;
    	let { showDays = false } = $$props;
    	let { showSeconds = true } = $$props;

    	function updateTimer() {
    		dispatch("tick", { seconds });
    	}

    	onDestroy(() => {
    		clearInterval(interval);
    	});

    	let interval = setInterval(updateTimer, 1000);
    	const writable_props = ['seconds', 'showLabels', 'showDays', 'showSeconds'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('seconds' in $$props) $$invalidate(7, seconds = $$props.seconds);
    		if ('showLabels' in $$props) $$invalidate(0, showLabels = $$props.showLabels);
    		if ('showDays' in $$props) $$invalidate(1, showDays = $$props.showDays);
    		if ('showSeconds' in $$props) $$invalidate(2, showSeconds = $$props.showSeconds);
    	};

    	$$self.$capture_state = () => ({
    		padNumber,
    		createEventDispatcher,
    		onDestroy,
    		dispatch,
    		seconds,
    		showLabels,
    		showDays,
    		showSeconds,
    		updateTimer,
    		interval,
    		m,
    		h,
    		d,
    		s
    	});

    	$$self.$inject_state = $$props => {
    		if ('seconds' in $$props) $$invalidate(7, seconds = $$props.seconds);
    		if ('showLabels' in $$props) $$invalidate(0, showLabels = $$props.showLabels);
    		if ('showDays' in $$props) $$invalidate(1, showDays = $$props.showDays);
    		if ('showSeconds' in $$props) $$invalidate(2, showSeconds = $$props.showSeconds);
    		if ('interval' in $$props) $$invalidate(10, interval = $$props.interval);
    		if ('m' in $$props) $$invalidate(3, m = $$props.m);
    		if ('h' in $$props) $$invalidate(4, h = $$props.h);
    		if ('d' in $$props) $$invalidate(5, d = $$props.d);
    		if ('s' in $$props) $$invalidate(6, s = $$props.s);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*seconds*/ 128) {
    			$$invalidate(5, d = Math.floor(seconds / 86400));
    		}

    		if ($$self.$$.dirty & /*seconds, showDays, d*/ 162) {
    			$$invalidate(4, h = Math.floor((seconds - (showDays ? d * 86400 : 0)) / 3600));
    		}

    		if ($$self.$$.dirty & /*seconds, showDays, d, h*/ 178) {
    			$$invalidate(3, m = Math.floor((seconds - (showDays ? d * 86400 : 0) - h * 3600) / 60));
    		}

    		if ($$self.$$.dirty & /*seconds, showDays, d, h, m*/ 186) {
    			$$invalidate(6, s = seconds - (showDays ? d * 86400 : 0) - h * 3600 - m * 60);
    		}

    		if ($$self.$$.dirty & /*seconds*/ 128) {
    			if (seconds <= 0) {
    				clearInterval(interval);
    			}
    		}
    	};

    	return [showLabels, showDays, showSeconds, m, h, d, s, seconds];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {
    			seconds: 7,
    			showLabels: 0,
    			showDays: 1,
    			showSeconds: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*seconds*/ ctx[7] === undefined && !('seconds' in props)) {
    			console.warn("<Timer> was created without expected prop 'seconds'");
    		}
    	}

    	get seconds() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set seconds(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLabels() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLabels(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showDays() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showDays(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showSeconds() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showSeconds(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/UI/ProgressBar/ProgressBar.svelte generated by Svelte v3.50.1 */

    const file$p = "src/components/UI/ProgressBar/ProgressBar.svelte";

    function create_fragment$q(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "progress svelte-1u851mo");
    			add_location(div0, file$p, 5, 2, 45);
    			attr_dev(div1, "class", "wrapper svelte-1u851mo");
    			add_location(div1, file$p, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProgressBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProgressBar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ProgressBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressBar",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src/components/common/ProgressTimer.svelte generated by Svelte v3.50.1 */
    const file$o = "src/components/common/ProgressTimer.svelte";

    function create_fragment$p(ctx) {
    	let div1;
    	let div0;
    	let timer;
    	let t;
    	let progressbar;
    	let div;
    	let __progress_percent_last;
    	let current;

    	const timer_spread_levels = [
    		{ seconds: /*secondsLeft*/ ctx[0] },
    		{
    			showLabels: /*showLabels*/ ctx[4],
    			showSeconds: /*showSeconds*/ ctx[5],
    			showDays: /*showDays*/ ctx[6]
    		}
    	];

    	let timer_props = {};

    	for (let i = 0; i < timer_spread_levels.length; i += 1) {
    		timer_props = assign(timer_props, timer_spread_levels[i]);
    	}

    	timer = new Timer({ props: timer_props, $$inline: true });
    	timer.$on("tick", /*tick_handler*/ ctx[10]);
    	progressbar = new ProgressBar({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(timer.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(progressbar.$$.fragment);
    			attr_dev(div0, "class", "time__header svelte-fj0708");
    			add_location(div0, file$o, 21, 2, 646);
    			set_style(div, "display", "contents");
    			set_style(div, "--progress-percent", __progress_percent_last = `${/*progressPercent*/ ctx[7]}%`);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			set_style(div, "--shadow-color", /*shadowColor*/ ctx[2]);
    			set_style(div, "--bg-color", /*bgColor*/ ctx[3]);
    			attr_dev(div1, "class", "time svelte-fj0708");
    			add_location(div1, file$o, 20, 0, 625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(timer, div0, null);
    			append_dev(div1, t);
    			append_dev(div1, div);
    			mount_component(progressbar, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const timer_changes = (dirty & /*secondsLeft, showLabels, showSeconds, showDays*/ 113)
    			? get_spread_update(timer_spread_levels, [
    					dirty & /*secondsLeft*/ 1 && { seconds: /*secondsLeft*/ ctx[0] },
    					dirty & /*showLabels, showSeconds, showDays*/ 112 && {
    						showLabels: /*showLabels*/ ctx[4],
    						showSeconds: /*showSeconds*/ ctx[5],
    						showDays: /*showDays*/ ctx[6]
    					}
    				])
    			: {};

    			timer.$set(timer_changes);

    			if (dirty & /*progressPercent*/ 128 && __progress_percent_last !== (__progress_percent_last = `${/*progressPercent*/ ctx[7]}%`)) {
    				set_style(div, "--progress-percent", __progress_percent_last);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*shadowColor*/ 4) {
    				set_style(div, "--shadow-color", /*shadowColor*/ ctx[2]);
    			}

    			if (dirty & /*bgColor*/ 8) {
    				set_style(div, "--bg-color", /*bgColor*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(progressbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(progressbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(timer);
    			destroy_component(progressbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let progressPercent;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProgressTimer', slots, []);
    	const dispatch = createEventDispatcher();
    	let { secondsLeft = 0 } = $$props;
    	let { secondsTotal = 0 } = $$props;
    	let { color = "var(--gradient-yellow)" } = $$props;
    	let { shadowColor = "var(--color-yellow)" } = $$props;
    	let { bgColor = "rgba(255, 255, 255, 0.3)" } = $$props;
    	let { showLabels = true } = $$props;
    	let { showSeconds = false } = $$props;
    	let { showDays = true } = $$props;

    	const writable_props = [
    		'secondsLeft',
    		'secondsTotal',
    		'color',
    		'shadowColor',
    		'bgColor',
    		'showLabels',
    		'showSeconds',
    		'showDays'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProgressTimer> was created with unknown prop '${key}'`);
    	});

    	const tick_handler = () => dispatch("tick");

    	$$self.$$set = $$props => {
    		if ('secondsLeft' in $$props) $$invalidate(0, secondsLeft = $$props.secondsLeft);
    		if ('secondsTotal' in $$props) $$invalidate(9, secondsTotal = $$props.secondsTotal);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('shadowColor' in $$props) $$invalidate(2, shadowColor = $$props.shadowColor);
    		if ('bgColor' in $$props) $$invalidate(3, bgColor = $$props.bgColor);
    		if ('showLabels' in $$props) $$invalidate(4, showLabels = $$props.showLabels);
    		if ('showSeconds' in $$props) $$invalidate(5, showSeconds = $$props.showSeconds);
    		if ('showDays' in $$props) $$invalidate(6, showDays = $$props.showDays);
    	};

    	$$self.$capture_state = () => ({
    		Timer,
    		createEventDispatcher,
    		ProgressBar,
    		dispatch,
    		secondsLeft,
    		secondsTotal,
    		color,
    		shadowColor,
    		bgColor,
    		showLabels,
    		showSeconds,
    		showDays,
    		progressPercent
    	});

    	$$self.$inject_state = $$props => {
    		if ('secondsLeft' in $$props) $$invalidate(0, secondsLeft = $$props.secondsLeft);
    		if ('secondsTotal' in $$props) $$invalidate(9, secondsTotal = $$props.secondsTotal);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('shadowColor' in $$props) $$invalidate(2, shadowColor = $$props.shadowColor);
    		if ('bgColor' in $$props) $$invalidate(3, bgColor = $$props.bgColor);
    		if ('showLabels' in $$props) $$invalidate(4, showLabels = $$props.showLabels);
    		if ('showSeconds' in $$props) $$invalidate(5, showSeconds = $$props.showSeconds);
    		if ('showDays' in $$props) $$invalidate(6, showDays = $$props.showDays);
    		if ('progressPercent' in $$props) $$invalidate(7, progressPercent = $$props.progressPercent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*secondsTotal, secondsLeft*/ 513) {
    			$$invalidate(7, progressPercent = secondsTotal == 0
    			? 0
    			: Math.floor(secondsLeft / secondsTotal * 100));
    		}
    	};

    	return [
    		secondsLeft,
    		color,
    		shadowColor,
    		bgColor,
    		showLabels,
    		showSeconds,
    		showDays,
    		progressPercent,
    		dispatch,
    		secondsTotal,
    		tick_handler
    	];
    }

    class ProgressTimer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {
    			secondsLeft: 0,
    			secondsTotal: 9,
    			color: 1,
    			shadowColor: 2,
    			bgColor: 3,
    			showLabels: 4,
    			showSeconds: 5,
    			showDays: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressTimer",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get secondsLeft() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondsLeft(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondsTotal() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondsTotal(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadowColor() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadowColor(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLabels() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLabels(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showSeconds() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showSeconds(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showDays() {
    		throw new Error("<ProgressTimer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showDays(value) {
    		throw new Error("<ProgressTimer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentHeader/NumberOfPrizes.svelte generated by Svelte v3.50.1 */

    const file$n = "src/pages/TournamentStuff/TournamentHeader/NumberOfPrizes.svelte";

    function create_fragment$o(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "количество призовых мест";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*numberOfPrizes*/ ctx[0]);
    			attr_dev(div0, "class", "countTitle svelte-io22si");
    			add_location(div0, file$n, 5, 2, 84);
    			attr_dev(div1, "class", "count svelte-io22si");
    			add_location(div1, file$n, 6, 2, 141);
    			attr_dev(div2, "class", "numberOfPrizes svelte-io22si");
    			add_location(div2, file$n, 4, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*numberOfPrizes*/ 1) set_data_dev(t2, /*numberOfPrizes*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NumberOfPrizes', slots, []);
    	let { numberOfPrizes = 0 } = $$props;
    	const writable_props = ['numberOfPrizes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumberOfPrizes> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('numberOfPrizes' in $$props) $$invalidate(0, numberOfPrizes = $$props.numberOfPrizes);
    	};

    	$$self.$capture_state = () => ({ numberOfPrizes });

    	$$self.$inject_state = $$props => {
    		if ('numberOfPrizes' in $$props) $$invalidate(0, numberOfPrizes = $$props.numberOfPrizes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [numberOfPrizes];
    }

    class NumberOfPrizes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { numberOfPrizes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumberOfPrizes",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get numberOfPrizes() {
    		throw new Error("<NumberOfPrizes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberOfPrizes(value) {
    		throw new Error("<NumberOfPrizes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-portal/src/Portal.svelte generated by Svelte v3.50.1 */

    const { Error: Error_1 } = globals;
    const file$m = "node_modules/svelte-portal/src/Portal.svelte";

    function create_fragment$n(ctx) {
    	let div;
    	let portal_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			div.hidden = true;
    			add_location(div, file$m, 59, 0, 1431);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(portal_action = portal.call(null, div, /*target*/ ctx[0]));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (portal_action && is_function(portal_action.update) && dirty & /*target*/ 1) portal_action.update.call(null, /*target*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function portal(el, target = "body") {
    	let targetEl;

    	async function update(newTarget) {
    		target = newTarget;

    		if (typeof target === "string") {
    			targetEl = document.querySelector(target);

    			if (targetEl === null) {
    				await tick();
    				targetEl = document.querySelector(target);
    			}

    			if (targetEl === null) {
    				throw new Error(`No element found matching css selector: "${target}"`);
    			}
    		} else if (target instanceof HTMLElement) {
    			targetEl = target;
    		} else {
    			throw new TypeError(`Unknown portal target type: ${target === null ? "null" : typeof target}. Allowed types: string (CSS selector) or HTMLElement.`);
    		}

    		targetEl.appendChild(el);
    		el.hidden = false;
    	}

    	function destroy() {
    		if (el.parentNode) {
    			el.parentNode.removeChild(el);
    		}
    	}

    	update(target);
    	return { update, destroy };
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Portal', slots, ['default']);
    	let { target = "body" } = $$props;
    	const writable_props = ['target'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Portal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('target' in $$props) $$invalidate(0, target = $$props.target);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ tick, portal, target });

    	$$self.$inject_state = $$props => {
    		if ('target' in $$props) $$invalidate(0, target = $$props.target);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [target, $$scope, slots];
    }

    class Portal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { target: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Portal",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get target() {
    		throw new Error_1("<Portal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set target(value) {
    		throw new Error_1("<Portal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/common/Modal.svelte generated by Svelte v3.50.1 */
    const file$l = "src/components/common/Modal.svelte";

    // (19:2) {#if isOpened}
    function create_if_block_2$2(ctx) {
    	let style;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "body {\n        overflow-y: hidden;\n      }\n      .modal-backdrop {\n        opacity: 0.7;\n        visibility: visible;\n      }";
    			add_location(style, file$l, 19, 4, 323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(19:2) {#if isOpened}",
    		ctx
    	});

    	return block;
    }

    // (33:2) {#if isOpened}
    function create_if_block$8(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let div0_style_value;
    	let div1_class_value;
    	let div2_style_value;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*heading*/ ctx[1]) return create_if_block_1$3;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "modal htp-modal narrow-modal");

    			attr_dev(div0, "style", div0_style_value = `
            ${/*disableBG*/ ctx[3] ? "background: unset" : ""}
          `);

    			add_location(div0, file$l, 35, 8, 721);
    			attr_dev(div1, "class", div1_class_value = "modal-dialog " + /*dialogClass*/ ctx[2] + " svelte-u3n53c");
    			add_location(div1, file$l, 34, 6, 672);
    			attr_dev(div2, "class", "modal-window");
    			attr_dev(div2, "style", div2_style_value = /*$$props*/ ctx[5].style);
    			toggle_class(div2, "active", /*isOpened*/ ctx[0]);
    			add_location(div2, file$l, 33, 4, 593);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    			append_dev(div0, t);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, t);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*disableBG*/ 8 && div0_style_value !== (div0_style_value = `
            ${/*disableBG*/ ctx[3] ? "background: unset" : ""}
          `)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (!current || dirty & /*dialogClass*/ 4 && div1_class_value !== (div1_class_value = "modal-dialog " + /*dialogClass*/ ctx[2] + " svelte-u3n53c")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*$$props*/ 32 && div2_style_value !== (div2_style_value = /*$$props*/ ctx[5].style)) {
    				attr_dev(div2, "style", div2_style_value);
    			}

    			if (!current || dirty & /*isOpened*/ 1) {
    				toggle_class(div2, "active", /*isOpened*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(33:2) {#if isOpened}",
    		ctx
    	});

    	return block;
    }

    // (47:10) {:else}
    function create_else_block$5(ctx) {
    	let div;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			attr_dev(span, "class", "myicon-close modal-close");
    			add_location(span, file$l, 48, 14, 1109);
    			attr_dev(div, "class", "closeIcon svelte-u3n53c");
    			add_location(div, file$l, 47, 12, 1071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*close*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(47:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:10) {#if heading}
    function create_if_block_1$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*heading*/ ctx[1]);
    			t1 = space();
    			span = element("span");
    			attr_dev(span, "class", "myicon-close modal-close");
    			add_location(span, file$l, 44, 14, 963);
    			attr_dev(div, "class", "heading");
    			add_location(div, file$l, 42, 12, 903);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, span);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*close*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*heading*/ 2) set_data_dev(t0, /*heading*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(42:10) {#if heading}",
    		ctx
    	});

    	return block;
    }

    // (32:0) <Portal target="#modals">
    function create_default_slot$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*isOpened*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*isOpened*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpened*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(32:0) <Portal target=\\\"#modals\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let if_block_anchor;
    	let t;
    	let portal;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isOpened*/ ctx[0] && create_if_block_2$2(ctx);

    	portal = new Portal({
    			props: {
    				target: "#modals",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			t = space();
    			create_component(portal.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(document.head, null);
    			append_dev(document.head, if_block_anchor);
    			insert_dev(target, t, anchor);
    			mount_component(portal, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "clickOutsideModal", /*close*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpened*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const portal_changes = {};

    			if (dirty & /*$$scope, $$props, isOpened, dialogClass, disableBG, heading*/ 303) {
    				portal_changes.$$scope = { dirty, ctx };
    			}

    			portal.$set(portal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			detach_dev(if_block_anchor);
    			if (detaching) detach_dev(t);
    			destroy_component(portal, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Modal', slots, ['default']);
    	let { heading = "" } = $$props;
    	let { isOpened = false } = $$props;
    	let { dialogClass = "" } = $$props;
    	let { disableBG = false } = $$props;

    	function open() {
    		$$invalidate(0, isOpened = true);
    	}

    	function close() {
    		$$invalidate(0, isOpened = false);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('heading' in $$new_props) $$invalidate(1, heading = $$new_props.heading);
    		if ('isOpened' in $$new_props) $$invalidate(0, isOpened = $$new_props.isOpened);
    		if ('dialogClass' in $$new_props) $$invalidate(2, dialogClass = $$new_props.dialogClass);
    		if ('disableBG' in $$new_props) $$invalidate(3, disableBG = $$new_props.disableBG);
    		if ('$$scope' in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Portal,
    		heading,
    		isOpened,
    		dialogClass,
    		disableBG,
    		open,
    		close
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ('heading' in $$props) $$invalidate(1, heading = $$new_props.heading);
    		if ('isOpened' in $$props) $$invalidate(0, isOpened = $$new_props.isOpened);
    		if ('dialogClass' in $$props) $$invalidate(2, dialogClass = $$new_props.dialogClass);
    		if ('disableBG' in $$props) $$invalidate(3, disableBG = $$new_props.disableBG);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		isOpened,
    		heading,
    		dialogClass,
    		disableBG,
    		close,
    		$$props,
    		open,
    		slots,
    		$$scope
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			heading: 1,
    			isOpened: 0,
    			dialogClass: 2,
    			disableBG: 3,
    			open: 6,
    			close: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get heading() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heading(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpened() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpened(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dialogClass() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dialogClass(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableBG() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableBG(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx[6];
    	}

    	set open(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[4];
    	}

    	set close(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/UI/Button/Button.svelte generated by Svelte v3.50.1 */

    const file$k = "src/components/UI/Button/Button.svelte";

    function create_fragment$l(ctx) {
    	let button;
    	let button_class_value;
    	let button_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			button.disabled = /*disabled*/ ctx[1];

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*className*/ ctx[4]} ${/*disableBorder*/ ctx[2]
			? "buttonWithDisabledBorder"
			: ""}
  ${/*customBoxShadow*/ ctx[3]
			? "buttonWithCustomHover"
			: ""}`) + " svelte-yrynqz"));

    			attr_dev(button, "style", button_style_value = `
  ${/*$$props*/ ctx[5].style}
  --custom-boxshadow: ${/*customBoxShadow*/ ctx[3] ?? ""}
`);

    			add_location(button, file$k, 13, 0, 332);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handler*/ ctx[0])) /*handler*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*disabled*/ 2) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[1]);
    			}

    			if (!current || dirty & /*disableBorder, customBoxShadow*/ 12 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*className*/ ctx[4]} ${/*disableBorder*/ ctx[2]
			? "buttonWithDisabledBorder"
			: ""}
  ${/*customBoxShadow*/ ctx[3]
			? "buttonWithCustomHover"
			: ""}`) + " svelte-yrynqz"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*$$props, customBoxShadow*/ 40 && button_style_value !== (button_style_value = `
  ${/*$$props*/ ctx[5].style}
  --custom-boxshadow: ${/*customBoxShadow*/ ctx[3] ?? ""}
`)) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { handler } = $$props;
    	let { hasOutline = true } = $$props;
    	let { disabled = false } = $$props;
    	let { color = "accent" } = $$props;
    	let { disableBorder = false } = $$props;
    	let { customBoxShadow = null } = $$props;

    	let className = `dark_btn ${hasOutline
	? "has-gradient-border dark-btn_outlined"
	: ""} ${$$props.class ?? ""}`;

    	$$self.$$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('handler' in $$new_props) $$invalidate(0, handler = $$new_props.handler);
    		if ('hasOutline' in $$new_props) $$invalidate(6, hasOutline = $$new_props.hasOutline);
    		if ('disabled' in $$new_props) $$invalidate(1, disabled = $$new_props.disabled);
    		if ('color' in $$new_props) $$invalidate(7, color = $$new_props.color);
    		if ('disableBorder' in $$new_props) $$invalidate(2, disableBorder = $$new_props.disableBorder);
    		if ('customBoxShadow' in $$new_props) $$invalidate(3, customBoxShadow = $$new_props.customBoxShadow);
    		if ('$$scope' in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		handler,
    		hasOutline,
    		disabled,
    		color,
    		disableBorder,
    		customBoxShadow,
    		className
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ('handler' in $$props) $$invalidate(0, handler = $$new_props.handler);
    		if ('hasOutline' in $$props) $$invalidate(6, hasOutline = $$new_props.hasOutline);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$new_props.disabled);
    		if ('color' in $$props) $$invalidate(7, color = $$new_props.color);
    		if ('disableBorder' in $$props) $$invalidate(2, disableBorder = $$new_props.disableBorder);
    		if ('customBoxShadow' in $$props) $$invalidate(3, customBoxShadow = $$new_props.customBoxShadow);
    		if ('className' in $$props) $$invalidate(4, className = $$new_props.className);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		handler,
    		disabled,
    		disableBorder,
    		customBoxShadow,
    		className,
    		$$props,
    		hasOutline,
    		color,
    		$$scope,
    		slots
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			handler: 0,
    			hasOutline: 6,
    			disabled: 1,
    			color: 7,
    			disableBorder: 2,
    			customBoxShadow: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handler*/ ctx[0] === undefined && !('handler' in props)) {
    			console.warn("<Button> was created without expected prop 'handler'");
    		}
    	}

    	get handler() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handler(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasOutline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasOutline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableBorder() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableBorder(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customBoxShadow() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customBoxShadow(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/Modals/HowToJoinTournament.svelte generated by Svelte v3.50.1 */
    const file$j = "src/pages/TournamentStuff/Modals/HowToJoinTournament.svelte";

    // (63:4) <Button       handler={onButtonClick}       style={`         min-height: 48px;         width: 100%;       `}     >
    function create_default_slot_1(ctx) {
    	let div;
    	let t0_value = /*buttonMapper*/ ctx[5][/*step*/ ctx[1]] + "";
    	let t0;
    	let t1;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			attr_dev(span, "class", "myicon-arrow-circle-right svelte-9cqq76");
    			add_location(span, file$j, 71, 8, 1733);
    			attr_dev(div, "class", "tournamentInfoButtonContent svelte-9cqq76");
    			add_location(div, file$j, 69, 6, 1654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, span);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*step*/ 2 && t0_value !== (t0_value = /*buttonMapper*/ ctx[5][/*step*/ ctx[1]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(63:4) <Button       handler={onButtonClick}       style={`         min-height: 48px;         width: 100%;       `}     >",
    		ctx
    	});

    	return block;
    }

    // (44:0) <Modal bind:this={modal} disableBG={true} dialogClass={"modal-w500"}>
    function create_default_slot$2(ctx) {
    	let div7;
    	let div0;
    	let t1;
    	let div1;
    	let img;
    	let img_class_value;
    	let img_src_value;
    	let div1_class_value;
    	let t2;
    	let div2;
    	let t3_value = /*titleMapper*/ ctx[3][/*step*/ ctx[1]] + "";
    	let t3;
    	let t4;
    	let div3;
    	let t5_value = /*descriptionMapper*/ ctx[4][/*step*/ ctx[1]] + "";
    	let t5;
    	let t6;
    	let button;
    	let t7;
    	let div6;
    	let div4;
    	let div4_class_value;
    	let t8;
    	let div5;
    	let div5_class_value;
    	let current;

    	button = new Button({
    			props: {
    				handler: /*onButtonClick*/ ctx[2],
    				style: `
        min-height: 48px;
        width: 100%;
      `,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			div0.textContent = "Как участвовать?";
    			t1 = space();
    			div1 = element("div");
    			img = element("img");
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			create_component(button.$$.fragment);
    			t7 = space();
    			div6 = element("div");
    			div4 = element("div");
    			t8 = space();
    			div5 = element("div");
    			attr_dev(div0, "class", "howToJoinTitle svelte-9cqq76");
    			add_location(div0, file$j, 45, 4, 1014);
    			attr_dev(img, "class", img_class_value = "howToJoinImage " + `howToJoinImageStep${/*step*/ ctx[1]}` + " svelte-9cqq76");
    			if (!src_url_equal(img.src, img_src_value = `assets/images/${/*imageMapper*/ ctx[6][/*step*/ ctx[1]]}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$j, 51, 6, 1221);

    			attr_dev(div1, "class", div1_class_value = "howToJoinImageBackground " + (/*step*/ ctx[1] === 1
    			? 'howToJoinImageBackgroundRed'
    			: 'howToJoinImageBackgroundPurple') + " svelte-9cqq76");

    			add_location(div1, file$j, 46, 4, 1069);
    			attr_dev(div2, "class", "howToJoinTextTitle svelte-9cqq76");
    			add_location(div2, file$j, 57, 4, 1385);
    			attr_dev(div3, "class", "howToJoinTextDescripton svelte-9cqq76");
    			add_location(div3, file$j, 58, 4, 1447);
    			attr_dev(div4, "class", div4_class_value = "howToJoinDot " + (/*step*/ ctx[1] === 1 ? 'howToJoinDotActive' : '') + " svelte-9cqq76");
    			add_location(div4, file$j, 76, 6, 1842);
    			attr_dev(div5, "class", div5_class_value = "howToJoinDot " + (/*step*/ ctx[1] === 2 ? 'howToJoinDotActive' : '') + " svelte-9cqq76");
    			add_location(div5, file$j, 77, 6, 1918);
    			attr_dev(div6, "class", "howToJoinDots svelte-9cqq76");
    			add_location(div6, file$j, 75, 4, 1808);
    			attr_dev(div7, "class", "bluredBackground svelte-9cqq76");
    			add_location(div7, file$j, 44, 2, 979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t1);
    			append_dev(div7, div1);
    			append_dev(div1, img);
    			append_dev(div7, t2);
    			append_dev(div7, div2);
    			append_dev(div2, t3);
    			append_dev(div7, t4);
    			append_dev(div7, div3);
    			append_dev(div3, t5);
    			append_dev(div7, t6);
    			mount_component(button, div7, null);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*step*/ 2 && img_class_value !== (img_class_value = "howToJoinImage " + `howToJoinImageStep${/*step*/ ctx[1]}` + " svelte-9cqq76")) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (!current || dirty & /*step*/ 2 && !src_url_equal(img.src, img_src_value = `assets/images/${/*imageMapper*/ ctx[6][/*step*/ ctx[1]]}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*step*/ 2 && div1_class_value !== (div1_class_value = "howToJoinImageBackground " + (/*step*/ ctx[1] === 1
    			? 'howToJoinImageBackgroundRed'
    			: 'howToJoinImageBackgroundPurple') + " svelte-9cqq76")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if ((!current || dirty & /*step*/ 2) && t3_value !== (t3_value = /*titleMapper*/ ctx[3][/*step*/ ctx[1]] + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*step*/ 2) && t5_value !== (t5_value = /*descriptionMapper*/ ctx[4][/*step*/ ctx[1]] + "")) set_data_dev(t5, t5_value);
    			const button_changes = {};

    			if (dirty & /*$$scope, step*/ 1026) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (!current || dirty & /*step*/ 2 && div4_class_value !== (div4_class_value = "howToJoinDot " + (/*step*/ ctx[1] === 1 ? 'howToJoinDotActive' : '') + " svelte-9cqq76")) {
    				attr_dev(div4, "class", div4_class_value);
    			}

    			if (!current || dirty & /*step*/ 2 && div5_class_value !== (div5_class_value = "howToJoinDot " + (/*step*/ ctx[1] === 2 ? 'howToJoinDotActive' : '') + " svelte-9cqq76")) {
    				attr_dev(div5, "class", div5_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(44:0) <Modal bind:this={modal} disableBG={true} dialogClass={\\\"modal-w500\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let modal_1;
    	let current;

    	let modal_1_props = {
    		disableBG: true,
    		dialogClass: "modal-w500",
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	modal_1 = new Modal({ props: modal_1_props, $$inline: true });
    	/*modal_1_binding*/ ctx[9](modal_1);

    	const block = {
    		c: function create() {
    			create_component(modal_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_1_changes = {};

    			if (dirty & /*$$scope, step*/ 1026) {
    				modal_1_changes.$$scope = { dirty, ctx };
    			}

    			modal_1.$set(modal_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*modal_1_binding*/ ctx[9](null);
    			destroy_component(modal_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HowToJoinTournament', slots, []);
    	let modal;
    	let step = 1;

    	function open() {
    		modal.open();
    		$$invalidate(1, step = 1);
    	}

    	function close() {
    		modal.close();
    	}

    	const onButtonClick = () => {
    		if (step === 2) {
    			modal.close();
    			return;
    		}

    		$$invalidate(1, step++, step);
    	};

    	const titleMapper = { 1: "Делайте ставки", 2: "Результат" };

    	const descriptionMapper = {
    		1: "Каждая ставка, сделанная на коэффициент от х1.5 идет в вашу турнирную статистику. Фриспины в зачет не идут",
    		2: "В момент завершения турнира, топ игроков разделят между собой банк. Для получения выигрыша онлайн быть не обязательно!"
    	};

    	const buttonMapper = { 1: "Далее", 2: "Я понял" };
    	const imageMapper = { 1: "slotMachine.png", 2: "stonks.png" };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HowToJoinTournament> was created with unknown prop '${key}'`);
    	});

    	function modal_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			modal = $$value;
    			$$invalidate(0, modal);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Modal,
    		Button,
    		modal,
    		step,
    		open,
    		close,
    		onButtonClick,
    		titleMapper,
    		descriptionMapper,
    		buttonMapper,
    		imageMapper
    	});

    	$$self.$inject_state = $$props => {
    		if ('modal' in $$props) $$invalidate(0, modal = $$props.modal);
    		if ('step' in $$props) $$invalidate(1, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		modal,
    		step,
    		onButtonClick,
    		titleMapper,
    		descriptionMapper,
    		buttonMapper,
    		imageMapper,
    		open,
    		close,
    		modal_1_binding
    	];
    }

    class HowToJoinTournament extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { open: 7, close: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HowToJoinTournament",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get open() {
    		return this.$$.ctx[7];
    	}

    	set open(value) {
    		throw new Error("<HowToJoinTournament>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[8];
    	}

    	set close(value) {
    		throw new Error("<HowToJoinTournament>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentHeader/TournamentInfo.svelte generated by Svelte v3.50.1 */
    const file$i = "src/pages/TournamentStuff/TournamentHeader/TournamentInfo.svelte";

    // (17:2) {#if isActiveTournament}
    function create_if_block$7(ctx) {
    	let div;
    	let numberofprizes;
    	let current;

    	numberofprizes = new NumberOfPrizes({
    			props: {
    				numberOfPrizes: /*numberOfPrizes*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(numberofprizes.$$.fragment);
    			attr_dev(div, "class", "numberOfPrizesWrapper svelte-17dxdb0");
    			add_location(div, file$i, 17, 4, 494);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(numberofprizes, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numberofprizes_changes = {};
    			if (dirty & /*numberOfPrizes*/ 1) numberofprizes_changes.numberOfPrizes = /*numberOfPrizes*/ ctx[0];
    			numberofprizes.$set(numberofprizes_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numberofprizes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numberofprizes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(numberofprizes);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(17:2) {#if isActiveTournament}",
    		ctx
    	});

    	return block;
    }

    // (27:4) <Button       handler={onButtonClick}       style={`         min-height: 37px;         width: 105px;         background: rgba(255, 255, 255, 0.15);       `}       customBoxShadow={"0 0 15px 0 rgba(255, 255, 255, 0.15);"}       disableBorder={true}     >
    function create_default_slot$1(ctx) {
    	let div;
    	let span0;
    	let t1;
    	let span1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "Читать";
    			t1 = space();
    			span1 = element("span");
    			add_location(span0, file$i, 37, 8, 1113);
    			attr_dev(span1, "class", "myicon-arrow-circle-right");
    			add_location(span1, file$i, 38, 8, 1143);
    			attr_dev(div, "class", "tournamentInfoButtonContent svelte-17dxdb0");
    			add_location(div, file$i, 36, 6, 1063);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(27:4) <Button       handler={onButtonClick}       style={`         min-height: 37px;         width: 105px;         background: rgba(255, 255, 255, 0.15);       `}       customBoxShadow={\\\"0 0 15px 0 rgba(255, 255, 255, 0.15);\\\"}       disableBorder={true}     >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div3;
    	let t0;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let t4;
    	let howtojointournament;
    	let div3_class_value;
    	let current;
    	let if_block = /*isActiveTournament*/ ctx[1] && create_if_block$7(ctx);

    	button = new Button({
    			props: {
    				handler: /*onButtonClick*/ ctx[3],
    				style: `
        min-height: 37px;
        width: 105px;
        background: rgba(255, 255, 255, 0.15);
      `,
    				customBoxShadow: "0 0 15px 0 rgba(255, 255, 255, 0.15);",
    				disableBorder: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let howtojointournament_props = {};

    	howtojointournament = new HowToJoinTournament({
    			props: howtojointournament_props,
    			$$inline: true
    		});

    	/*howtojointournament_binding*/ ctx[4](howtojointournament);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Как принять участие в турнире?";
    			t3 = space();
    			create_component(button.$$.fragment);
    			t4 = space();
    			create_component(howtojointournament.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "assets/images/copy-dynamic-color.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "info");
    			attr_dev(img, "class", "svelte-17dxdb0");
    			add_location(img, file$i, 23, 6, 655);
    			attr_dev(div0, "class", "howToStartBG svelte-17dxdb0");
    			add_location(div0, file$i, 22, 4, 622);
    			attr_dev(div1, "class", "howToStartTitle svelte-17dxdb0");
    			add_location(div1, file$i, 25, 4, 733);
    			attr_dev(div2, "class", "howToStart svelte-17dxdb0");
    			add_location(div2, file$i, 21, 2, 593);

    			attr_dev(div3, "class", div3_class_value = "tournamentInfo " + (/*isActiveTournament*/ ctx[1]
    			? 'tournamentInfoActive'
    			: '') + " svelte-17dxdb0");

    			add_location(div3, file$i, 15, 0, 383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(button, div2, null);
    			append_dev(div3, t4);
    			mount_component(howtojointournament, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isActiveTournament*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isActiveTournament*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			const howtojointournament_changes = {};
    			howtojointournament.$set(howtojointournament_changes);

    			if (!current || dirty & /*isActiveTournament*/ 2 && div3_class_value !== (div3_class_value = "tournamentInfo " + (/*isActiveTournament*/ ctx[1]
    			? 'tournamentInfoActive'
    			: '') + " svelte-17dxdb0")) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button.$$.fragment, local);
    			transition_in(howtojointournament.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button.$$.fragment, local);
    			transition_out(howtojointournament.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			destroy_component(button);
    			/*howtojointournament_binding*/ ctx[4](null);
    			destroy_component(howtojointournament);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TournamentInfo', slots, []);
    	let { numberOfPrizes = null } = $$props;
    	let { isActiveTournament = true } = $$props;
    	let howToJoinModal;

    	const onButtonClick = () => {
    		howToJoinModal.open();
    	};

    	const writable_props = ['numberOfPrizes', 'isActiveTournament'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TournamentInfo> was created with unknown prop '${key}'`);
    	});

    	function howtojointournament_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			howToJoinModal = $$value;
    			$$invalidate(2, howToJoinModal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('numberOfPrizes' in $$props) $$invalidate(0, numberOfPrizes = $$props.numberOfPrizes);
    		if ('isActiveTournament' in $$props) $$invalidate(1, isActiveTournament = $$props.isActiveTournament);
    	};

    	$$self.$capture_state = () => ({
    		HowToJoinTournament,
    		Button,
    		NumberOfPrizes,
    		numberOfPrizes,
    		isActiveTournament,
    		howToJoinModal,
    		onButtonClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('numberOfPrizes' in $$props) $$invalidate(0, numberOfPrizes = $$props.numberOfPrizes);
    		if ('isActiveTournament' in $$props) $$invalidate(1, isActiveTournament = $$props.isActiveTournament);
    		if ('howToJoinModal' in $$props) $$invalidate(2, howToJoinModal = $$props.howToJoinModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		numberOfPrizes,
    		isActiveTournament,
    		howToJoinModal,
    		onButtonClick,
    		howtojointournament_binding
    	];
    }

    class TournamentInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { numberOfPrizes: 0, isActiveTournament: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TournamentInfo",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get numberOfPrizes() {
    		throw new Error("<TournamentInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberOfPrizes(value) {
    		throw new Error("<TournamentInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isActiveTournament() {
    		throw new Error("<TournamentInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isActiveTournament(value) {
    		throw new Error("<TournamentInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const formatMoney = (amount) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    /* src/pages/TournamentStuff/TournamentHeader/WinAmount.svelte generated by Svelte v3.50.1 */
    const file$h = "src/pages/TournamentStuff/TournamentHeader/WinAmount.svelte";

    function create_fragment$i(ctx) {
    	let div4;
    	let div1;
    	let span0;
    	let t1;
    	let div0;
    	let span1;
    	let t2_value = formatMoney(/*wonAmount*/ ctx[0]) + "";
    	let t2;
    	let t3;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div3;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "общая сумма выиграша на турнире";
    			t1 = space();
    			div0 = element("div");
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div3 = element("div");
    			img1 = element("img");
    			attr_dev(span0, "class", "winAmountTitle svelte-1evmo7c");
    			add_location(span0, file$h, 8, 4, 176);
    			attr_dev(span1, "class", "winAmountSum svelte-1evmo7c");
    			add_location(span1, file$h, 10, 6, 260);
    			add_location(div0, file$h, 9, 4, 248);
    			attr_dev(div1, "class", "winAmountContent svelte-1evmo7c");
    			add_location(div1, file$h, 7, 2, 141);
    			if (!src_url_equal(img0.src, img0_src_value = "assets/images/coup.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "svelte-1evmo7c");
    			add_location(img0, file$h, 16, 4, 408);
    			attr_dev(div2, "class", "winAmountCoup winAmountCoupRight svelte-1evmo7c");
    			add_location(div2, file$h, 15, 2, 357);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/images/coup.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "svelte-1evmo7c");
    			add_location(img1, file$h, 19, 4, 514);
    			attr_dev(div3, "class", "winAmountCoup winAmountCoupLeft svelte-1evmo7c");
    			add_location(div3, file$h, 18, 2, 464);
    			attr_dev(div4, "class", "winAmountWrapper svelte-1evmo7c");
    			add_location(div4, file$h, 6, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, img0);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, img1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*wonAmount*/ 1 && t2_value !== (t2_value = formatMoney(/*wonAmount*/ ctx[0]) + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WinAmount', slots, []);
    	let { wonAmount = null } = $$props;
    	const writable_props = ['wonAmount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WinAmount> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('wonAmount' in $$props) $$invalidate(0, wonAmount = $$props.wonAmount);
    	};

    	$$self.$capture_state = () => ({ formatMoney, wonAmount });

    	$$self.$inject_state = $$props => {
    		if ('wonAmount' in $$props) $$invalidate(0, wonAmount = $$props.wonAmount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wonAmount];
    }

    class WinAmount extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { wonAmount: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WinAmount",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get wonAmount() {
    		throw new Error("<WinAmount>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wonAmount(value) {
    		throw new Error("<WinAmount>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentHeader/TournamentHeader.svelte generated by Svelte v3.50.1 */
    const file$g = "src/pages/TournamentStuff/TournamentHeader/TournamentHeader.svelte";

    // (50:0) {:else}
    function create_else_block$4(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let div2;
    	let tournamentinfo;
    	let current;

    	tournamentinfo = new TournamentInfo({
    			props: { isActiveTournament: false },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Турнир еще не начался";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Следите за новостями в наших группах, когда начнется";
    			t4 = space();
    			div2 = element("div");
    			create_component(tournamentinfo.$$.fragment);
    			attr_dev(div0, "class", "tournamentHeaderInactiveImage svelte-1bsby62");
    			add_location(div0, file$g, 51, 4, 1491);
    			attr_dev(span0, "class", "tournmentDidntStartTitle svelte-1bsby62");
    			add_location(span0, file$g, 53, 6, 1581);
    			attr_dev(span1, "class", "tournmentDidntStartDescription svelte-1bsby62");
    			add_location(span1, file$g, 54, 6, 1655);
    			attr_dev(div1, "class", "tournmentDidntStart svelte-1bsby62");
    			add_location(div1, file$g, 52, 4, 1541);
    			attr_dev(div2, "class", "tournamentInfoWrapper svelte-1bsby62");
    			add_location(div2, file$g, 58, 4, 1791);
    			attr_dev(div3, "class", "tournamentHeaderInactive svelte-1bsby62");
    			add_location(div3, file$g, 50, 2, 1448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(tournamentinfo, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tournamentinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tournamentinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(tournamentinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(50:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:0) {#if game.is_active}
    function create_if_block$6(ctx) {
    	let div4;
    	let tournamentinfo;
    	let t0;
    	let winamount;
    	let t1;
    	let div3;
    	let div0;
    	let numberofprizes;
    	let t2;
    	let div2;
    	let div1;
    	let t4;
    	let progresstimer;
    	let current;

    	tournamentinfo = new TournamentInfo({
    			props: {
    				numberOfPrizes: /*game*/ ctx[2].prizes.length
    			},
    			$$inline: true
    		});

    	winamount = new WinAmount({
    			props: { wonAmount: /*wonAmount*/ ctx[3] },
    			$$inline: true
    		});

    	numberofprizes = new NumberOfPrizes({
    			props: {
    				numberOfPrizes: /*game*/ ctx[2].prizes.length
    			},
    			$$inline: true
    		});

    	progresstimer = new ProgressTimer({
    			props: {
    				showDays: /*time_left*/ ctx[1] > 60,
    				showSeconds: /*time_left*/ ctx[1] <= 60,
    				secondsLeft: /*time_left*/ ctx[1],
    				secondsTotal: /*totalTime*/ ctx[0],
    				bgColor: `#2e3038`
    			},
    			$$inline: true
    		});

    	progresstimer.$on("tick", /*tick_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			create_component(tournamentinfo.$$.fragment);
    			t0 = space();
    			create_component(winamount.$$.fragment);
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(numberofprizes.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "Турнир кончится через";
    			t4 = space();
    			create_component(progresstimer.$$.fragment);
    			attr_dev(div0, "class", "numberOfPrizesWrapper svelte-1bsby62");
    			add_location(div0, file$g, 33, 6, 945);
    			attr_dev(div1, "class", "timerTitle svelte-1bsby62");
    			add_location(div1, file$g, 37, 8, 1106);
    			attr_dev(div2, "class", "timerWrapperProgress svelte-1bsby62");
    			add_location(div2, file$g, 36, 6, 1063);
    			attr_dev(div3, "class", "timerWrapper svelte-1bsby62");
    			add_location(div3, file$g, 32, 4, 912);
    			attr_dev(div4, "class", "tournamentHeader svelte-1bsby62");
    			add_location(div4, file$g, 28, 2, 787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			mount_component(tournamentinfo, div4, null);
    			append_dev(div4, t0);
    			mount_component(winamount, div4, null);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(numberofprizes, div0, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t4);
    			mount_component(progresstimer, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const progresstimer_changes = {};
    			if (dirty & /*time_left*/ 2) progresstimer_changes.showDays = /*time_left*/ ctx[1] > 60;
    			if (dirty & /*time_left*/ 2) progresstimer_changes.showSeconds = /*time_left*/ ctx[1] <= 60;
    			if (dirty & /*time_left*/ 2) progresstimer_changes.secondsLeft = /*time_left*/ ctx[1];
    			if (dirty & /*totalTime*/ 1) progresstimer_changes.secondsTotal = /*totalTime*/ ctx[0];
    			progresstimer.$set(progresstimer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tournamentinfo.$$.fragment, local);
    			transition_in(winamount.$$.fragment, local);
    			transition_in(numberofprizes.$$.fragment, local);
    			transition_in(progresstimer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tournamentinfo.$$.fragment, local);
    			transition_out(winamount.$$.fragment, local);
    			transition_out(numberofprizes.$$.fragment, local);
    			transition_out(progresstimer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(tournamentinfo);
    			destroy_component(winamount);
    			destroy_component(numberofprizes);
    			destroy_component(progresstimer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(28:0) {#if game.is_active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*game*/ ctx[2].is_active) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let time_left;
    	let totalTime;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TournamentHeader', slots, []);
    	const { game } = getContext("tournamentContext");

    	const wonAmount = game.prizes.reduce(
    		(acc, curValue) => {
    			return acc + curValue;
    		},
    		0
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TournamentHeader> was created with unknown prop '${key}'`);
    	});

    	const tick_handler = () => $$invalidate(1, time_left--, time_left);

    	$$self.$capture_state = () => ({
    		getContext,
    		ProgressTimer,
    		NumberOfPrizes,
    		TournamentInfo,
    		WinAmount,
    		game,
    		wonAmount,
    		totalTime,
    		time_left
    	});

    	$$self.$inject_state = $$props => {
    		if ('totalTime' in $$props) $$invalidate(0, totalTime = $$props.totalTime);
    		if ('time_left' in $$props) $$invalidate(1, time_left = $$props.time_left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(1, time_left = game.is_active
    	? Math.floor((new Date(game.deadline).getTime() - new Date().getTime()) / 1000)
    	: 0);

    	$$invalidate(0, totalTime = game.is_active
    	? Math.floor((new Date(game.deadline).getTime() - new Date(game.created_at).getTime()) / 1000)
    	: 0);

    	return [totalTime, time_left, game, wonAmount, tick_handler];
    }

    class TournamentHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TournamentHeader",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src/pages/TournamentStuff/UI/InlineSkeleton.svelte generated by Svelte v3.50.1 */

    const file$f = "src/pages/TournamentStuff/UI/InlineSkeleton.svelte";

    function create_fragment$g(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "inlineSkeleton svelte-16nax7v");

    			attr_dev(div, "style", div_style_value = `
    width: ${/*width*/ ctx[0]}px;
    ${/*$$props*/ ctx[1].style}
`);

    			add_location(div, file$f, 4, 0, 46);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*width, $$props*/ 3 && div_style_value !== (div_style_value = `
    width: ${/*width*/ ctx[0]}px;
    ${/*$$props*/ ctx[1].style}
`)) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InlineSkeleton', slots, []);
    	let { width = 120 } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('width' in $$new_props) $$invalidate(0, width = $$new_props.width);
    	};

    	$$self.$capture_state = () => ({ width });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), $$new_props));
    		if ('width' in $$props) $$invalidate(0, width = $$new_props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [width, $$props];
    }

    class InlineSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { width: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InlineSkeleton",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get width() {
    		throw new Error("<InlineSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<InlineSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/UI/AvatarSkeleton.svelte generated by Svelte v3.50.1 */

    const file$e = "src/pages/TournamentStuff/UI/AvatarSkeleton.svelte";

    function create_fragment$f(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let div2_style_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "inlineSkeletonBG svelte-cwtbyk");
    			add_location(div0, file$e, 12, 2, 179);
    			attr_dev(div1, "class", "inlineSkeleton svelte-cwtbyk");
    			add_location(div1, file$e, 13, 2, 214);
    			attr_dev(div2, "class", "inlineSkeletonWrapper svelte-cwtbyk");

    			attr_dev(div2, "style", div2_style_value = `
        width: ${/*size*/ ctx[0]}px;
        height: ${/*size*/ ctx[0]}px;
        ${/*$$props*/ ctx[1].style}
  `);

    			add_location(div2, file$e, 4, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, $$props*/ 3 && div2_style_value !== (div2_style_value = `
        width: ${/*size*/ ctx[0]}px;
        height: ${/*size*/ ctx[0]}px;
        ${/*$$props*/ ctx[1].style}
  `)) {
    				attr_dev(div2, "style", div2_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AvatarSkeleton', slots, []);
    	let { size = 50 } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
    	};

    	$$self.$capture_state = () => ({ size });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [size, $$props];
    }

    class AvatarSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { size: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AvatarSkeleton",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get size() {
    		throw new Error("<AvatarSkeleton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<AvatarSkeleton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentTable/SkeletonRow.svelte generated by Svelte v3.50.1 */
    const file$d = "src/pages/TournamentStuff/TournamentTable/SkeletonRow.svelte";

    function create_fragment$e(ctx) {
    	let tr;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let td0;
    	let inlineskeleton0;
    	let t1;
    	let td1;
    	let avatarskeleton;
    	let t2;
    	let inlineskeleton1;
    	let t3;
    	let td2;
    	let inlineskeleton2;
    	let t4;
    	let td3;
    	let inlineskeleton3;
    	let current;
    	inlineskeleton0 = new InlineSkeleton({ props: { width: "44" }, $$inline: true });

    	avatarskeleton = new AvatarSkeleton({
    			props: {
    				style: `
            margin-right: 38px;
        `
    			},
    			$$inline: true
    		});

    	inlineskeleton1 = new InlineSkeleton({ props: { width: "230" }, $$inline: true });
    	inlineskeleton2 = new InlineSkeleton({ props: { width: "120" }, $$inline: true });
    	inlineskeleton3 = new InlineSkeleton({ props: { width: "120" }, $$inline: true });

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			td0 = element("td");
    			create_component(inlineskeleton0.$$.fragment);
    			t1 = space();
    			td1 = element("td");
    			create_component(avatarskeleton.$$.fragment);
    			t2 = space();
    			create_component(inlineskeleton1.$$.fragment);
    			t3 = space();
    			td2 = element("td");
    			create_component(inlineskeleton2.$$.fragment);
    			t4 = space();
    			td3 = element("td");
    			create_component(inlineskeleton3.$$.fragment);
    			attr_dev(div0, "class", "row-bg svelte-7y221n");
    			add_location(div0, file$d, 7, 4, 176);
    			attr_dev(td0, "class", "svelte-7y221n");
    			add_location(td0, file$d, 9, 6, 227);
    			attr_dev(td1, "class", "svelte-7y221n");
    			add_location(td1, file$d, 10, 6, 272);
    			attr_dev(td2, "class", "svelte-7y221n");
    			add_location(td2, file$d, 18, 6, 431);
    			attr_dev(td3, "class", "svelte-7y221n");
    			add_location(td3, file$d, 21, 6, 493);
    			attr_dev(div1, "class", "row svelte-7y221n");
    			add_location(div1, file$d, 8, 4, 203);
    			attr_dev(div2, "class", "trReplacer svelte-7y221n");
    			add_location(div2, file$d, 6, 2, 147);
    			attr_dev(tr, "class", "svelte-7y221n");
    			add_location(tr, file$d, 5, 0, 140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, td0);
    			mount_component(inlineskeleton0, td0, null);
    			append_dev(div1, t1);
    			append_dev(div1, td1);
    			mount_component(avatarskeleton, td1, null);
    			append_dev(td1, t2);
    			mount_component(inlineskeleton1, td1, null);
    			append_dev(div1, t3);
    			append_dev(div1, td2);
    			mount_component(inlineskeleton2, td2, null);
    			append_dev(div1, t4);
    			append_dev(div1, td3);
    			mount_component(inlineskeleton3, td3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inlineskeleton0.$$.fragment, local);
    			transition_in(avatarskeleton.$$.fragment, local);
    			transition_in(inlineskeleton1.$$.fragment, local);
    			transition_in(inlineskeleton2.$$.fragment, local);
    			transition_in(inlineskeleton3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inlineskeleton0.$$.fragment, local);
    			transition_out(avatarskeleton.$$.fragment, local);
    			transition_out(inlineskeleton1.$$.fragment, local);
    			transition_out(inlineskeleton2.$$.fragment, local);
    			transition_out(inlineskeleton3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(inlineskeleton0);
    			destroy_component(avatarskeleton);
    			destroy_component(inlineskeleton1);
    			destroy_component(inlineskeleton2);
    			destroy_component(inlineskeleton3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SkeletonRow', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SkeletonRow> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ AvatarSkeleton, InlineSkeleton });
    	return [];
    }

    class SkeletonRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SkeletonRow",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/components/UI/Table/svg/AwardsSvg.svelte generated by Svelte v3.50.1 */

    const file$c = "src/components/UI/Table/svg/AwardsSvg.svelte";

    function create_fragment$d(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M0.833252 0.666656H9.16658V7.20832C9.16658 7.52777 9.09714 7.81249 8.95825 8.06249C8.81936 8.31249 8.62492 8.51388 8.37492 8.66666L5.41658 10.4167L5.99992 12.3333H9.16658L6.58325 14.1667L7.58325 17.3333L4.99992 15.375L2.41658 17.3333L3.41659 14.1667L0.833252 12.3333H3.99992L4.58325 10.4167L1.62492 8.66666C1.37492 8.51388 1.18047 8.31249 1.04159 8.06249C0.902696 7.81249 0.833252 7.52777 0.833252 7.20832V0.666656ZM4.16659 2.33332V8.20832L4.99992 8.70832L5.83325 8.20832V2.33332H4.16659Z");
    			attr_dev(path, "fill", /*color*/ ctx[0]);
    			add_location(path, file$c, 11, 2, 161);
    			attr_dev(svg, "width", "10");
    			attr_dev(svg, "height", "18");
    			attr_dev(svg, "viewBox", "0 0 10 18");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$c, 4, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				attr_dev(path, "fill", /*color*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AwardsSvg', slots, []);
    	let { color = "#FFBB29" } = $$props;
    	const writable_props = ['color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AwardsSvg> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ color });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color];
    }

    class AwardsSvg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AwardsSvg",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get color() {
    		throw new Error("<AwardsSvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<AwardsSvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/UI/Table/svg/StocksSvg.svelte generated by Svelte v3.50.1 */

    const file$b = "src/components/UI/Table/svg/StocksSvg.svelte";

    function create_fragment$c(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M8 7.16667C5.91667 7.16667 4.14583 6.84028 2.6875 6.1875C1.22917 5.53472 0.5 4.75 0.5 3.83333C0.5 2.91667 1.22917 2.13194 2.6875 1.47917C4.14583 0.826389 5.91667 0.5 8 0.5C10.0833 0.5 11.8542 0.826389 13.3125 1.47917C14.7708 2.13194 15.5 2.91667 15.5 3.83333C15.5 4.75 14.7708 5.53472 13.3125 6.1875C11.8542 6.84028 10.0833 7.16667 8 7.16667ZM8 11.3333C5.91667 11.3333 4.14583 11.0069 2.6875 10.3542C1.22917 9.70139 0.5 8.91667 0.5 8V5.91667C0.5 6.52778 0.784722 7.04528 1.35417 7.46917C1.92361 7.8925 2.60417 8.23611 3.39583 8.5C4.1875 8.76389 5.01056 8.95472 5.865 9.0725C6.71889 9.19083 7.43056 9.25 8 9.25C8.56944 9.25 9.28111 9.19083 10.135 9.0725C10.9894 8.95472 11.8125 8.76389 12.6042 8.5C13.3958 8.23611 14.0764 7.8925 14.6458 7.46917C15.2153 7.04528 15.5 6.52778 15.5 5.91667V8C15.5 8.91667 14.7708 9.70139 13.3125 10.3542C11.8542 11.0069 10.0833 11.3333 8 11.3333ZM8 15.5C5.91667 15.5 4.14583 15.1736 2.6875 14.5208C1.22917 13.8681 0.5 13.0833 0.5 12.1667V10.0833C0.5 10.6944 0.784722 11.2119 1.35417 11.6358C1.92361 12.0592 2.60417 12.4028 3.39583 12.6667C4.1875 12.9306 5.01056 13.1217 5.865 13.24C6.71889 13.3578 7.43056 13.4167 8 13.4167C8.56944 13.4167 9.28111 13.3578 10.135 13.24C10.9894 13.1217 11.8125 12.9306 12.6042 12.6667C13.3958 12.4028 14.0764 12.0592 14.6458 11.6358C15.2153 11.2119 15.5 10.6944 15.5 10.0833V12.1667C15.5 13.0833 14.7708 13.8681 13.3125 14.5208C11.8542 15.1736 10.0833 15.5 8 15.5Z");
    			attr_dev(path, "fill", /*color*/ ctx[0]);
    			add_location(path, file$b, 12, 2, 189);
    			attr_dev(svg, "width", /*size*/ ctx[1]);
    			attr_dev(svg, "height", /*size*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$b, 5, 0, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				attr_dev(path, "fill", /*color*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 2) {
    				attr_dev(svg, "width", /*size*/ ctx[1]);
    			}

    			if (dirty & /*size*/ 2) {
    				attr_dev(svg, "height", /*size*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StocksSvg', slots, []);
    	let { color = "#FFBB29" } = $$props;
    	let { size = 16 } = $$props;
    	const writable_props = ['color', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StocksSvg> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ color, size });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, size];
    }

    class StocksSvg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { color: 0, size: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StocksSvg",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get color() {
    		throw new Error("<StocksSvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<StocksSvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<StocksSvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<StocksSvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Box/Box.svelte generated by Svelte v3.50.1 */

    const file$a = "src/components/Box/Box.svelte";

    // (11:2) {#if glow}
    function create_if_block_1$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "glow svelte-6hwl18");
    			add_location(div, file$a, 11, 4, 227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(11:2) {#if glow}",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if glowBottom}
    function create_if_block$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "glow-bottom svelte-6hwl18");
    			add_location(div, file$a, 14, 4, 283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(14:2) {#if glowBottom}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let div_class_value;
    	let div_style_value;
    	let current;
    	let if_block0 = /*glow*/ ctx[0] && create_if_block_1$2(ctx);
    	let if_block1 = /*glowBottom*/ ctx[1] && create_if_block$5(ctx);
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`${/*$$props*/ ctx[3].class} box ${/*hasOutline*/ ctx[2] ? 'outlined' : ''}`) + " svelte-6hwl18"));
    			attr_dev(div, "style", div_style_value = /*$$props*/ ctx[3].style);
    			add_location(div, file$a, 6, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*glow*/ ctx[0]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*glowBottom*/ ctx[1]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[4],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*$$props, hasOutline*/ 12 && div_class_value !== (div_class_value = "" + (null_to_empty(`${/*$$props*/ ctx[3].class} box ${/*hasOutline*/ ctx[2] ? 'outlined' : ''}`) + " svelte-6hwl18"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*$$props*/ 8 && div_style_value !== (div_style_value = /*$$props*/ ctx[3].style)) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Box', slots, ['default']);
    	let { glow = false } = $$props;
    	let { glowBottom = false } = $$props;
    	let { hasOutline = true } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('glow' in $$new_props) $$invalidate(0, glow = $$new_props.glow);
    		if ('glowBottom' in $$new_props) $$invalidate(1, glowBottom = $$new_props.glowBottom);
    		if ('hasOutline' in $$new_props) $$invalidate(2, hasOutline = $$new_props.hasOutline);
    		if ('$$scope' in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ glow, glowBottom, hasOutline });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ('glow' in $$props) $$invalidate(0, glow = $$new_props.glow);
    		if ('glowBottom' in $$props) $$invalidate(1, glowBottom = $$new_props.glowBottom);
    		if ('hasOutline' in $$props) $$invalidate(2, hasOutline = $$new_props.hasOutline);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [glow, glowBottom, hasOutline, $$props, $$scope, slots];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { glow: 0, glowBottom: 1, hasOutline: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get glow() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set glow(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get glowBottom() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set glowBottom(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasOutline() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasOutline(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/constants.svelte generated by Svelte v3.50.1 */

    const RANKS = [
    	{
    		id: 0,
    		name: 'Новичок',
    		background: 'blue'
    	},
    	{
    		id: 1,
    		name: 'Начинающий',
    		background: 'blue'
    	},
    	{
    		id: 2,
    		name: 'Любитель',
    		background: 'blue'
    	},
    	{
    		id: 3,
    		name: 'Азартный',
    		background: 'yellow'
    	},
    	{
    		id: 4,
    		name: 'Профи',
    		background: 'yellow'
    	},
    	{
    		id: 5,
    		name: 'Акула',
    		background: 'yellow'
    	},
    	{
    		id: 6,
    		name: 'Мастер',
    		background: 'green'
    	},
    	{
    		id: 7,
    		name: 'Гроссмейстер',
    		background: 'green'
    	},
    	{
    		id: 8,
    		name: 'Cash Machine',
    		background: 'green'
    	},
    	{
    		id: 9,
    		name: 'Morgenstern',
    		background: 'green'
    	},
    	{
    		id: 10,
    		name: 'Diamond',
    		background: 'red'
    	},
    	{
    		id: 11,
    		name: 'Superior',
    		background: 'red'
    	},
    	{
    		id: 12,
    		name: 'Legend',
    		background: 'red'
    	},
    	{
    		id: 13,
    		name: 'International',
    		background: 'silver'
    	},
    	{
    		id: 14,
    		name: 'Immortal',
    		background: 'silver'
    	},
    	{
    		id: 15,
    		name: 'Godlike',
    		background: 'silver'
    	}
    ];

    /* src/components/common/RankIcon.svelte generated by Svelte v3.50.1 */
    const file$9 = "src/components/common/RankIcon.svelte";

    // (10:0) <Box     class="box"     style={`         --bg-color: var(--rank-gradient-${RANKS[rankId]?.background});         --border-color: var(--rank-gradient-border-${RANKS[rankId]?.background});         --border-radius: ${isSmall ? '6px' : 'var(--border-radius-common)'};     `} >
    function create_default_slot(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/images/ranks/" + /*rankId*/ ctx[0] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "rank");
    			attr_dev(img, "class", "svelte-91vxyp");
    			add_location(img, file$9, 18, 8, 592);
    			attr_dev(div, "class", "rankWrapper svelte-91vxyp");

    			set_style(div, "padding", /*customPadding*/ ctx[2]
    			? /*customPadding*/ ctx[2] + 'px'
    			: /*isSmall*/ ctx[1] ? '6px' : '10px');

    			add_location(div, file$9, 17, 4, 477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rankId*/ 1 && !src_url_equal(img.src, img_src_value = "assets/images/ranks/" + /*rankId*/ ctx[0] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*customPadding, isSmall*/ 6) {
    				set_style(div, "padding", /*customPadding*/ ctx[2]
    				? /*customPadding*/ ctx[2] + 'px'
    				: /*isSmall*/ ctx[1] ? '6px' : '10px');
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:0) <Box     class=\\\"box\\\"     style={`         --bg-color: var(--rank-gradient-${RANKS[rankId]?.background});         --border-color: var(--rank-gradient-border-${RANKS[rankId]?.background});         --border-radius: ${isSmall ? '6px' : 'var(--border-radius-common)'};     `} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				class: "box",
    				style: `
        --bg-color: var(--rank-gradient-${RANKS[/*rankId*/ ctx[0]]?.background});
        --border-color: var(--rank-gradient-border-${RANKS[/*rankId*/ ctx[0]]?.background});
        --border-radius: ${/*isSmall*/ ctx[1]
				? '6px'
				: 'var(--border-radius-common)'};
    `,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const box_changes = {};

    			if (dirty & /*rankId, isSmall*/ 3) box_changes.style = `
        --bg-color: var(--rank-gradient-${RANKS[/*rankId*/ ctx[0]]?.background});
        --border-color: var(--rank-gradient-border-${RANKS[/*rankId*/ ctx[0]]?.background});
        --border-radius: ${/*isSmall*/ ctx[1]
			? '6px'
			: 'var(--border-radius-common)'};
    `;

    			if (dirty & /*$$scope, customPadding, isSmall, rankId*/ 15) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RankIcon', slots, []);
    	let { rankId = 0 } = $$props;
    	let { isSmall = false } = $$props;
    	let { customPadding = null } = $$props;
    	const writable_props = ['rankId', 'isSmall', 'customPadding'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RankIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('rankId' in $$props) $$invalidate(0, rankId = $$props.rankId);
    		if ('isSmall' in $$props) $$invalidate(1, isSmall = $$props.isSmall);
    		if ('customPadding' in $$props) $$invalidate(2, customPadding = $$props.customPadding);
    	};

    	$$self.$capture_state = () => ({
    		Box,
    		RANKS,
    		rankId,
    		isSmall,
    		customPadding
    	});

    	$$self.$inject_state = $$props => {
    		if ('rankId' in $$props) $$invalidate(0, rankId = $$props.rankId);
    		if ('isSmall' in $$props) $$invalidate(1, isSmall = $$props.isSmall);
    		if ('customPadding' in $$props) $$invalidate(2, customPadding = $$props.customPadding);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rankId, isSmall, customPadding];
    }

    class RankIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { rankId: 0, isSmall: 1, customPadding: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RankIcon",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get rankId() {
    		throw new Error("<RankIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rankId(value) {
    		throw new Error("<RankIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isSmall() {
    		throw new Error("<RankIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isSmall(value) {
    		throw new Error("<RankIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customPadding() {
    		throw new Error("<RankIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customPadding(value) {
    		throw new Error("<RankIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/UI/AvatarWithRank.svelte generated by Svelte v3.50.1 */
    const file$8 = "src/pages/TournamentStuff/UI/AvatarWithRank.svelte";

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let div0_style_value;
    	let t;
    	let div1;
    	let rankicon;
    	let current;

    	rankicon = new RankIcon({
    			props: {
    				style: `
        --border-radius: 6px;
      `,
    				customPadding: 4,
    				rankId: /*rankId*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			create_component(rankicon.$$.fragment);
    			attr_dev(div0, "class", "userAvatar svelte-3uczrg");

    			attr_dev(div0, "style", div0_style_value = `
        background-image: url(${/*src*/ ctx[0]});
    `);

    			add_location(div0, file$8, 8, 2, 168);
    			attr_dev(div1, "class", "rankIconWrapper svelte-3uczrg");
    			add_location(div1, file$8, 14, 2, 262);
    			attr_dev(div2, "class", "userInfo svelte-3uczrg");
    			add_location(div2, file$8, 7, 0, 143);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(rankicon, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*src*/ 1 && div0_style_value !== (div0_style_value = `
        background-image: url(${/*src*/ ctx[0]});
    `)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			const rankicon_changes = {};
    			if (dirty & /*rankId*/ 2) rankicon_changes.rankId = /*rankId*/ ctx[1];
    			rankicon.$set(rankicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rankicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rankicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(rankicon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AvatarWithRank', slots, []);
    	let { src = null } = $$props;
    	let { rankId = null } = $$props;
    	const writable_props = ['src', 'rankId'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AvatarWithRank> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('rankId' in $$props) $$invalidate(1, rankId = $$props.rankId);
    	};

    	$$self.$capture_state = () => ({ RankIcon, src, rankId });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('rankId' in $$props) $$invalidate(1, rankId = $$props.rankId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, rankId];
    }

    class AvatarWithRank extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { src: 0, rankId: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AvatarWithRank",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get src() {
    		throw new Error("<AvatarWithRank>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<AvatarWithRank>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rankId() {
    		throw new Error("<AvatarWithRank>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rankId(value) {
    		throw new Error("<AvatarWithRank>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentTable/TableRow.svelte generated by Svelte v3.50.1 */
    const file$7 = "src/pages/TournamentStuff/TournamentTable/TableRow.svelte";

    // (26:8) {#if isActiveUser}
    function create_if_block$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = `${"(Ты)"}`;
    			attr_dev(span, "class", "isUser svelte-18wpmi3");
    			add_location(span, file$7, 26, 10, 777);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(26:8) {#if isActiveUser}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let tr;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let td0;
    	let t1;
    	let t2;
    	let td1;
    	let avatarwithrank;
    	let t3;
    	let span0;
    	let t4;
    	let t5;
    	let t6;
    	let td2;
    	let stockssvg;
    	let t7;
    	let span1;
    	let t8_value = formatMoney(/*bet_sum*/ ctx[4]) + "";
    	let t8;
    	let t9;
    	let td3;
    	let awardssvg;
    	let t10;
    	let span2;
    	let t11_value = formatMoney(/*won_amount*/ ctx[5]) + "";
    	let t11;
    	let div2_class_value;
    	let current;

    	avatarwithrank = new AvatarWithRank({
    			props: {
    				src: /*avatar*/ ctx[1],
    				rankId: /*rank_id*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block = /*isActiveUser*/ ctx[6] && create_if_block$4(ctx);
    	stockssvg = new StocksSvg({ $$inline: true });

    	awardssvg = new AwardsSvg({
    			props: { color: "var(--color-green)" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			td0 = element("td");
    			t1 = text(/*tournament_id*/ ctx[0]);
    			t2 = space();
    			td1 = element("td");
    			create_component(avatarwithrank.$$.fragment);
    			t3 = space();
    			span0 = element("span");
    			t4 = text(/*username*/ ctx[3]);
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			td2 = element("td");
    			create_component(stockssvg.$$.fragment);
    			t7 = space();
    			span1 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			td3 = element("td");
    			create_component(awardssvg.$$.fragment);
    			t10 = space();
    			span2 = element("span");
    			t11 = text(t11_value);
    			attr_dev(div0, "class", "row-bg svelte-18wpmi3");
    			add_location(div0, file$7, 17, 4, 527);
    			attr_dev(td0, "class", "svelte-18wpmi3");
    			add_location(td0, file$7, 19, 6, 578);
    			attr_dev(span0, "class", "userName svelte-18wpmi3");
    			add_location(span0, file$7, 22, 8, 679);
    			attr_dev(td1, "class", "svelte-18wpmi3");
    			add_location(td1, file$7, 20, 6, 609);
    			attr_dev(span1, "class", "svelte-18wpmi3");
    			add_location(span1, file$7, 33, 8, 905);
    			attr_dev(td2, "class", "svelte-18wpmi3");
    			add_location(td2, file$7, 31, 6, 870);
    			attr_dev(span2, "class", "svelte-18wpmi3");
    			add_location(span2, file$7, 37, 8, 1021);
    			attr_dev(td3, "class", "svelte-18wpmi3");
    			add_location(td3, file$7, 35, 6, 959);
    			attr_dev(div1, "class", "row svelte-18wpmi3");
    			add_location(div1, file$7, 18, 4, 554);
    			attr_dev(div2, "class", div2_class_value = "trReplacer " + (/*isActiveUser*/ ctx[6] ? 'userRow' : '') + " svelte-18wpmi3");
    			add_location(div2, file$7, 16, 2, 466);
    			attr_dev(tr, "class", "svelte-18wpmi3");
    			add_location(tr, file$7, 15, 0, 459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, td0);
    			append_dev(td0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, td1);
    			mount_component(avatarwithrank, td1, null);
    			append_dev(td1, t3);
    			append_dev(td1, span0);
    			append_dev(span0, t4);
    			append_dev(td1, t5);
    			if (if_block) if_block.m(td1, null);
    			append_dev(div1, t6);
    			append_dev(div1, td2);
    			mount_component(stockssvg, td2, null);
    			append_dev(td2, t7);
    			append_dev(td2, span1);
    			append_dev(span1, t8);
    			append_dev(div1, t9);
    			append_dev(div1, td3);
    			mount_component(awardssvg, td3, null);
    			append_dev(td3, t10);
    			append_dev(td3, span2);
    			append_dev(span2, t11);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*tournament_id*/ 1) set_data_dev(t1, /*tournament_id*/ ctx[0]);
    			const avatarwithrank_changes = {};
    			if (dirty & /*avatar*/ 2) avatarwithrank_changes.src = /*avatar*/ ctx[1];
    			if (dirty & /*rank_id*/ 4) avatarwithrank_changes.rankId = /*rank_id*/ ctx[2];
    			avatarwithrank.$set(avatarwithrank_changes);
    			if (!current || dirty & /*username*/ 8) set_data_dev(t4, /*username*/ ctx[3]);

    			if (/*isActiveUser*/ ctx[6]) {
    				if (if_block) ; else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(td1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*bet_sum*/ 16) && t8_value !== (t8_value = formatMoney(/*bet_sum*/ ctx[4]) + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*won_amount*/ 32) && t11_value !== (t11_value = formatMoney(/*won_amount*/ ctx[5]) + "")) set_data_dev(t11, t11_value);

    			if (!current || dirty & /*isActiveUser*/ 64 && div2_class_value !== (div2_class_value = "trReplacer " + (/*isActiveUser*/ ctx[6] ? 'userRow' : '') + " svelte-18wpmi3")) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatarwithrank.$$.fragment, local);
    			transition_in(stockssvg.$$.fragment, local);
    			transition_in(awardssvg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(avatarwithrank.$$.fragment, local);
    			transition_out(stockssvg.$$.fragment, local);
    			transition_out(awardssvg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(avatarwithrank);
    			if (if_block) if_block.d();
    			destroy_component(stockssvg);
    			destroy_component(awardssvg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TableRow', slots, []);
    	let { tournament_id } = $$props;
    	let { avatar } = $$props;
    	let { rank_id } = $$props;
    	let { username } = $$props;
    	let { bet_sum } = $$props;
    	let { won_amount } = $$props;
    	let { isActiveUser } = $$props;

    	const writable_props = [
    		'tournament_id',
    		'avatar',
    		'rank_id',
    		'username',
    		'bet_sum',
    		'won_amount',
    		'isActiveUser'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TableRow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tournament_id' in $$props) $$invalidate(0, tournament_id = $$props.tournament_id);
    		if ('avatar' in $$props) $$invalidate(1, avatar = $$props.avatar);
    		if ('rank_id' in $$props) $$invalidate(2, rank_id = $$props.rank_id);
    		if ('username' in $$props) $$invalidate(3, username = $$props.username);
    		if ('bet_sum' in $$props) $$invalidate(4, bet_sum = $$props.bet_sum);
    		if ('won_amount' in $$props) $$invalidate(5, won_amount = $$props.won_amount);
    		if ('isActiveUser' in $$props) $$invalidate(6, isActiveUser = $$props.isActiveUser);
    	};

    	$$self.$capture_state = () => ({
    		AwardsSvg,
    		StocksSvg,
    		formatMoney,
    		AvatarWithRank,
    		tournament_id,
    		avatar,
    		rank_id,
    		username,
    		bet_sum,
    		won_amount,
    		isActiveUser
    	});

    	$$self.$inject_state = $$props => {
    		if ('tournament_id' in $$props) $$invalidate(0, tournament_id = $$props.tournament_id);
    		if ('avatar' in $$props) $$invalidate(1, avatar = $$props.avatar);
    		if ('rank_id' in $$props) $$invalidate(2, rank_id = $$props.rank_id);
    		if ('username' in $$props) $$invalidate(3, username = $$props.username);
    		if ('bet_sum' in $$props) $$invalidate(4, bet_sum = $$props.bet_sum);
    		if ('won_amount' in $$props) $$invalidate(5, won_amount = $$props.won_amount);
    		if ('isActiveUser' in $$props) $$invalidate(6, isActiveUser = $$props.isActiveUser);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tournament_id, avatar, rank_id, username, bet_sum, won_amount, isActiveUser];
    }

    class TableRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			tournament_id: 0,
    			avatar: 1,
    			rank_id: 2,
    			username: 3,
    			bet_sum: 4,
    			won_amount: 5,
    			isActiveUser: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableRow",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tournament_id*/ ctx[0] === undefined && !('tournament_id' in props)) {
    			console.warn("<TableRow> was created without expected prop 'tournament_id'");
    		}

    		if (/*avatar*/ ctx[1] === undefined && !('avatar' in props)) {
    			console.warn("<TableRow> was created without expected prop 'avatar'");
    		}

    		if (/*rank_id*/ ctx[2] === undefined && !('rank_id' in props)) {
    			console.warn("<TableRow> was created without expected prop 'rank_id'");
    		}

    		if (/*username*/ ctx[3] === undefined && !('username' in props)) {
    			console.warn("<TableRow> was created without expected prop 'username'");
    		}

    		if (/*bet_sum*/ ctx[4] === undefined && !('bet_sum' in props)) {
    			console.warn("<TableRow> was created without expected prop 'bet_sum'");
    		}

    		if (/*won_amount*/ ctx[5] === undefined && !('won_amount' in props)) {
    			console.warn("<TableRow> was created without expected prop 'won_amount'");
    		}

    		if (/*isActiveUser*/ ctx[6] === undefined && !('isActiveUser' in props)) {
    			console.warn("<TableRow> was created without expected prop 'isActiveUser'");
    		}
    	}

    	get tournament_id() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tournament_id(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatar() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatar(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rank_id() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rank_id(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get username() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bet_sum() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bet_sum(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get won_amount() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set won_amount(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isActiveUser() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isActiveUser(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentTable/TournamentTable.svelte generated by Svelte v3.50.1 */
    const file$6 = "src/pages/TournamentStuff/TournamentTable/TournamentTable.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (28:12) {:else}
    function create_else_block_1$1(ctx) {
    	let th0;
    	let inlineskeleton0;
    	let t0;
    	let th1;
    	let inlineskeleton1;
    	let t1;
    	let th2;
    	let inlineskeleton2;
    	let t2;
    	let th3;
    	let inlineskeleton3;
    	let current;
    	inlineskeleton0 = new InlineSkeleton({ props: { width: "44" }, $$inline: true });
    	inlineskeleton1 = new InlineSkeleton({ props: { width: "230" }, $$inline: true });
    	inlineskeleton2 = new InlineSkeleton({ props: { width: "151" }, $$inline: true });
    	inlineskeleton3 = new InlineSkeleton({ props: { width: "151" }, $$inline: true });

    	const block = {
    		c: function create() {
    			th0 = element("th");
    			create_component(inlineskeleton0.$$.fragment);
    			t0 = space();
    			th1 = element("th");
    			create_component(inlineskeleton1.$$.fragment);
    			t1 = space();
    			th2 = element("th");
    			create_component(inlineskeleton2.$$.fragment);
    			t2 = space();
    			th3 = element("th");
    			create_component(inlineskeleton3.$$.fragment);
    			attr_dev(th0, "class", "svelte-1m7wlj7");
    			add_location(th0, file$6, 28, 14, 904);
    			attr_dev(th1, "class", "svelte-1m7wlj7");
    			add_location(th1, file$6, 29, 14, 957);
    			attr_dev(th2, "class", "svelte-1m7wlj7");
    			add_location(th2, file$6, 30, 14, 1011);
    			attr_dev(th3, "class", "svelte-1m7wlj7");
    			add_location(th3, file$6, 31, 14, 1065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th0, anchor);
    			mount_component(inlineskeleton0, th0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, th1, anchor);
    			mount_component(inlineskeleton1, th1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, th2, anchor);
    			mount_component(inlineskeleton2, th2, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, th3, anchor);
    			mount_component(inlineskeleton3, th3, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inlineskeleton0.$$.fragment, local);
    			transition_in(inlineskeleton1.$$.fragment, local);
    			transition_in(inlineskeleton2.$$.fragment, local);
    			transition_in(inlineskeleton3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inlineskeleton0.$$.fragment, local);
    			transition_out(inlineskeleton1.$$.fragment, local);
    			transition_out(inlineskeleton2.$$.fragment, local);
    			transition_out(inlineskeleton3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th0);
    			destroy_component(inlineskeleton0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(th1);
    			destroy_component(inlineskeleton1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(th2);
    			destroy_component(inlineskeleton2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(th3);
    			destroy_component(inlineskeleton3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(28:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:12) {#if game.is_active}
    function create_if_block_2$1(ctx) {
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;

    	const block = {
    		c: function create() {
    			th0 = element("th");
    			th0.textContent = "Место";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Имя игрока";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Ставок";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Награда";
    			attr_dev(th0, "class", "svelte-1m7wlj7");
    			add_location(th0, file$6, 23, 14, 760);
    			attr_dev(th1, "class", "svelte-1m7wlj7");
    			add_location(th1, file$6, 24, 14, 789);
    			attr_dev(th2, "class", "svelte-1m7wlj7");
    			add_location(th2, file$6, 25, 14, 823);
    			attr_dev(th3, "class", "svelte-1m7wlj7");
    			add_location(th3, file$6, 26, 14, 853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, th1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, th2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, th3, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(th1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(th2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(th3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(23:12) {#if game.is_active}",
    		ctx
    	});

    	return block;
    }

    // (61:10) {:else}
    function create_else_block$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*skeletonData*/ ctx[5];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[12];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(61:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:10) {#if game.is_active}
    function create_if_block$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let if_block_anchor;
    	let current;
    	let each_value = /*formatedLeaders*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*row*/ ctx[7].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	let if_block = /*isUserAfterList*/ ctx[3] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game, formatedLeaders, user_bet*/ 19) {
    				each_value = /*formatedLeaders*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, t.parentNode, outro_and_destroy_block, create_each_block$1, t, get_each_context$1);
    				check_outros();
    			}

    			if (/*isUserAfterList*/ ctx[3]) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(37:10) {#if game.is_active}",
    		ctx
    	});

    	return block;
    }

    // (62:12) {#each skeletonData as _, i (i)}
    function create_each_block_1$1(key_1, ctx) {
    	let first;
    	let skeletonrow;
    	let current;
    	skeletonrow = new SkeletonRow({ $$inline: true });

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(skeletonrow.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(skeletonrow, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(skeletonrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(skeletonrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(skeletonrow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(62:12) {#each skeletonData as _, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (38:12) {#each formatedLeaders as row (row.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let tablerow;
    	let current;

    	tablerow = new TableRow({
    			props: {
    				showSkeleton: !/*game*/ ctx[1].is_active,
    				isActiveUser: /*row*/ ctx[7].tournament_id === /*user_bet*/ ctx[0].tournament_id,
    				tournament_id: /*row*/ ctx[7].tournament_id,
    				avatar: /*row*/ ctx[7].user.avatar,
    				rank_id: /*row*/ ctx[7].user.rank_id,
    				username: /*row*/ ctx[7].user.username,
    				bet_sum: /*row*/ ctx[7].bet_sum,
    				won_amount: /*row*/ ctx[7].won_amount
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(tablerow.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(tablerow, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(tablerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(38:12) {#each formatedLeaders as row (row.id)}",
    		ctx
    	});

    	return block;
    }

    // (50:12) {#if isUserAfterList}
    function create_if_block_1$1(ctx) {
    	let tablerow;
    	let current;

    	tablerow = new TableRow({
    			props: {
    				isActiveUser: true,
    				tournament_id: /*user_bet*/ ctx[0].tournament_id,
    				avatar: /*user_bet*/ ctx[0].user.avatar,
    				rank_id: /*user_bet*/ ctx[0].user.rank_id,
    				username: /*user_bet*/ ctx[0].user.username,
    				bet_sum: /*user_bet*/ ctx[0].bet_sum,
    				won_amount: /*user_bet*/ ctx[0].won_amount
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tablerow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tablerow, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tablerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(50:12) {#if isUserAfterList}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let tbody;
    	let current_block_type_index_1;
    	let if_block1;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*game*/ ctx[1].is_active) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$3, create_else_block$3];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*game*/ ctx[1].is_active) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			if_block0.c();
    			t = space();
    			tbody = element("tbody");
    			if_block1.c();
    			attr_dev(tr, "class", "svelte-1m7wlj7");
    			add_location(tr, file$6, 21, 10, 708);
    			attr_dev(thead, "class", "svelte-1m7wlj7");
    			add_location(thead, file$6, 20, 8, 690);
    			add_location(tbody, file$6, 35, 8, 1164);
    			set_style(table, "--table-cols", /*cols*/ ctx[2]);
    			attr_dev(table, "class", "svelte-1m7wlj7");
    			add_location(table, file$6, 19, 6, 644);
    			attr_dev(div0, "class", "scroll-table svelte-1m7wlj7");
    			attr_dev(div0, "data-simplebar", "");
    			add_location(div0, file$6, 18, 4, 596);
    			attr_dev(div1, "class", "wrapper svelte-1m7wlj7");
    			add_location(div1, file$6, 17, 2, 570);
    			attr_dev(div2, "class", "tournamentTable svelte-1m7wlj7");
    			add_location(div2, file$6, 16, 0, 538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			if_blocks[current_block_type_index].m(tr, null);
    			append_dev(table, t);
    			append_dev(table, tbody);
    			if_blocks_1[current_block_type_index_1].m(tbody, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block1.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TournamentTable', slots, []);
    	const { leaders, user_bet, game } = getContext("tournamentContext");

    	const cols = game.is_active
    	? "10% 60% 15% 15%"
    	: "10% 45% 22.5% 22.5%";

    	const isUserAfterList = user_bet.tournament_id > 12;
    	const formatedLeaders = leaders.slice(3, 13 - isUserAfterList);
    	const skeletonData = [...Array(8).keys()];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TournamentTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getContext,
    		InlineSkeleton,
    		SkeletonRow,
    		TableRow,
    		leaders,
    		user_bet,
    		game,
    		cols,
    		isUserAfterList,
    		formatedLeaders,
    		skeletonData
    	});

    	return [user_bet, game, cols, isUserAfterList, formatedLeaders, skeletonData];
    }

    class TournamentTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TournamentTable",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/common/AvatarWithBorder.svelte generated by Svelte v3.50.1 */

    const file$5 = "src/components/common/AvatarWithBorder.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let div1_style_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "profileImg svelte-sz06tq");

    			attr_dev(div0, "style", div0_style_value = `
            background-image: url(${/*imgUrl*/ ctx[0]});
        `);

    			add_location(div0, file$5, 5, 2, 100);
    			attr_dev(div1, "class", "profileAvatar svelte-sz06tq");
    			attr_dev(div1, "style", div1_style_value = /*$$props*/ ctx[1].style);
    			add_location(div1, file$5, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imgUrl*/ 1 && div0_style_value !== (div0_style_value = `
            background-image: url(${/*imgUrl*/ ctx[0]});
        `)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*$$props*/ 2 && div1_style_value !== (div1_style_value = /*$$props*/ ctx[1].style)) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AvatarWithBorder', slots, []);
    	let { imgUrl = null } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('imgUrl' in $$new_props) $$invalidate(0, imgUrl = $$new_props.imgUrl);
    	};

    	$$self.$capture_state = () => ({ imgUrl });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), $$new_props));
    		if ('imgUrl' in $$props) $$invalidate(0, imgUrl = $$new_props.imgUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [imgUrl, $$props];
    }

    class AvatarWithBorder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { imgUrl: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AvatarWithBorder",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get imgUrl() {
    		throw new Error("<AvatarWithBorder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgUrl(value) {
    		throw new Error("<AvatarWithBorder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/UI/CardSkeleton.svelte generated by Svelte v3.50.1 */

    const file$4 = "src/pages/TournamentStuff/UI/CardSkeleton.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cardSkeleton svelte-3wfrqq");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardSkeleton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardSkeleton> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CardSkeleton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardSkeleton",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/TournamentStuff/TournamentTop3Winners/TournamentCrown.svelte generated by Svelte v3.50.1 */

    const file$3 = "src/pages/TournamentStuff/TournamentTop3Winners/TournamentCrown.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M8.0762 28.2399H59.0969C60.2788 28.2399 61.3167 27.4546 61.6382 26.3173L66.2189 10.1083C66.546 8.95107 65.8515 7.75253 64.6848 7.46085C63.8446 7.25081 62.9625 7.57523 62.4326 8.26029C53.1798 20.2239 47.3381 16.7159 37.2355 1.28564C36.7437 0.534372 35.9047 0.0714111 35.0068 0.0714111H32.17C31.27 0.0714111 30.4288 0.538143 29.9362 1.29136C19.5264 17.2096 13.8142 19.0914 5.25839 8.33158C4.67636 7.59962 3.73142 7.24382 2.81853 7.44669C1.48203 7.74369 0.670113 9.10325 1.04245 10.4208L5.53494 26.3173C5.85636 27.4546 6.89433 28.2399 8.0762 28.2399ZM8.27856 32.2011C6.82009 32.2011 5.63777 33.3834 5.63777 34.8419V38.3629C5.63777 39.8214 6.82009 41.0037 8.27856 41.0037H59.3339C60.7924 41.0037 61.9747 39.8214 61.9747 38.3629V34.8419C61.9747 33.3834 60.7924 32.2011 59.3339 32.2011H8.27856Z");
    			attr_dev(path, "fill", /*fill*/ ctx[0]);
    			add_location(path, file$3, 11, 2, 157);
    			attr_dev(svg, "width", "67");
    			attr_dev(svg, "height", "42");
    			attr_dev(svg, "viewBox", "0 0 67 42");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fill*/ 1) {
    				attr_dev(path, "fill", /*fill*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TournamentCrown', slots, []);
    	let { fill = "none" } = $$props;
    	const writable_props = ['fill'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TournamentCrown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('fill' in $$props) $$invalidate(0, fill = $$props.fill);
    	};

    	$$self.$capture_state = () => ({ fill });

    	$$self.$inject_state = $$props => {
    		if ('fill' in $$props) $$invalidate(0, fill = $$props.fill);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fill];
    }

    class TournamentCrown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { fill: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TournamentCrown",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get fill() {
    		throw new Error("<TournamentCrown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<TournamentCrown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentTop3Winners/WinnerCard.svelte generated by Svelte v3.50.1 */
    const file$2 = "src/pages/TournamentStuff/TournamentTop3Winners/WinnerCard.svelte";

    // (43:4) {#if !isInactiveGame || user}
    function create_if_block_5(ctx) {
    	let div;
    	let span;
    	let t;
    	let if_block0 = !/*isInactiveGame*/ ctx[0] && create_if_block_7(ctx);
    	let if_block1 = (/*isUser*/ ctx[2] || /*user*/ ctx[3]) && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$2, 44, 8, 1238);
    			attr_dev(div, "class", "tournamentWinnerPlace svelte-54gurg");
    			add_location(div, file$2, 43, 6, 1194);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isInactiveGame*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(span, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isUser*/ ctx[2] || /*user*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(43:4) {#if !isInactiveGame || user}",
    		ctx
    	});

    	return block;
    }

    // (46:10) {#if !isInactiveGame}
    function create_if_block_7(ctx) {
    	let t0_value = /*placeMapper*/ ctx[4][/*winner*/ ctx[1]?.tournament_id] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("place");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winner*/ 2 && t0_value !== (t0_value = /*placeMapper*/ ctx[4][/*winner*/ ctx[1]?.tournament_id] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(46:10) {#if !isInactiveGame}",
    		ctx
    	});

    	return block;
    }

    // (51:8) {#if isUser || user}
    function create_if_block_6(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "это Вы";
    			add_location(span, file$2, 51, 10, 1403);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(51:8) {#if isUser || user}",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#if !isInactiveGame}
    function create_if_block_4(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let tournamentcrown;
    	let div1_style_value;
    	let current;

    	tournamentcrown = new TournamentCrown({
    			props: {
    				fill: /*crownColorMapper*/ ctx[5][/*winner*/ ctx[1]?.tournament_id]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			create_component(tournamentcrown.$$.fragment);
    			attr_dev(div0, "class", "tournamentWinnerCrownBG svelte-54gurg");
    			add_location(div0, file$2, 65, 8, 1684);
    			attr_dev(div1, "class", "tournamentWinnerCrown svelte-54gurg");

    			attr_dev(div1, "style", div1_style_value = `
        --tournamentWinnerCrownBG-color: ${/*crownColorMapper*/ ctx[5][/*winner*/ ctx[1]?.tournament_id]}
        `);

    			add_location(div1, file$2, 57, 6, 1493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);
    			mount_component(tournamentcrown, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tournamentcrown_changes = {};
    			if (dirty & /*winner*/ 2) tournamentcrown_changes.fill = /*crownColorMapper*/ ctx[5][/*winner*/ ctx[1]?.tournament_id];
    			tournamentcrown.$set(tournamentcrown_changes);

    			if (!current || dirty & /*winner*/ 2 && div1_style_value !== (div1_style_value = `
        --tournamentWinnerCrownBG-color: ${/*crownColorMapper*/ ctx[5][/*winner*/ ctx[1]?.tournament_id]}
        `)) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tournamentcrown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tournamentcrown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(tournamentcrown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(57:4) {#if !isInactiveGame}",
    		ctx
    	});

    	return block;
    }

    // (81:8) {:else}
    function create_else_block_3(ctx) {
    	let avatarwithborder;
    	let t;
    	let div;
    	let rankicon;
    	let current;

    	avatarwithborder = new AvatarWithBorder({
    			props: {
    				imgUrl: /*user*/ ctx[3]
    				? /*user*/ ctx[3].avatar
    				: /*winner*/ ctx[1]?.user.avatar
    			},
    			$$inline: true
    		});

    	rankicon = new RankIcon({
    			props: {
    				customPadding: 4,
    				rankId: /*user*/ ctx[3]
    				? /*user*/ ctx[3].rank_id
    				: /*winner*/ ctx[1]?.user.rank_id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(avatarwithborder.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(rankicon.$$.fragment);
    			attr_dev(div, "class", "tournamentWinnerRankWrapper svelte-54gurg");
    			add_location(div, file$2, 82, 10, 2231);
    		},
    		m: function mount(target, anchor) {
    			mount_component(avatarwithborder, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(rankicon, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const avatarwithborder_changes = {};

    			if (dirty & /*user, winner*/ 10) avatarwithborder_changes.imgUrl = /*user*/ ctx[3]
    			? /*user*/ ctx[3].avatar
    			: /*winner*/ ctx[1]?.user.avatar;

    			avatarwithborder.$set(avatarwithborder_changes);
    			const rankicon_changes = {};

    			if (dirty & /*user, winner*/ 10) rankicon_changes.rankId = /*user*/ ctx[3]
    			? /*user*/ ctx[3].rank_id
    			: /*winner*/ ctx[1]?.user.rank_id;

    			rankicon.$set(rankicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatarwithborder.$$.fragment, local);
    			transition_in(rankicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(avatarwithborder.$$.fragment, local);
    			transition_out(rankicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(avatarwithborder, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(rankicon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(81:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:8) {#if isInactiveGame && !user}
    function create_if_block_3(ctx) {
    	let avatarskeleton;
    	let current;
    	avatarskeleton = new AvatarSkeleton({ props: { size: 140 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(avatarskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(avatarskeleton, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatarskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(avatarskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(avatarskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(79:8) {#if isInactiveGame && !user}",
    		ctx
    	});

    	return block;
    }

    // (97:8) {:else}
    function create_else_block_2(ctx) {
    	let t_value = (/*user*/ ctx[3]
    	? /*user*/ ctx[3].username
    	: /*winner*/ ctx[1]?.user.username) + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user, winner*/ 10 && t_value !== (t_value = (/*user*/ ctx[3]
    			? /*user*/ ctx[3].username
    			: /*winner*/ ctx[1]?.user.username) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(97:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (95:8) {#if isInactiveGame && !user}
    function create_if_block_2(ctx) {
    	let inlineskeleton;
    	let current;

    	inlineskeleton = new InlineSkeleton({
    			props: { width: 218, style: `margin-bottom: 8px;` },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inlineskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inlineskeleton, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inlineskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inlineskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inlineskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(95:8) {#if isInactiveGame && !user}",
    		ctx
    	});

    	return block;
    }

    // (104:8) {:else}
    function create_else_block_1(ctx) {
    	let t_value = RANKS[/*user*/ ctx[3]
    	? /*user*/ ctx[3].rank_id
    	: /*winner*/ ctx[1]?.user.rank_id].name + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user, winner*/ 10 && t_value !== (t_value = RANKS[/*user*/ ctx[3]
    			? /*user*/ ctx[3].rank_id
    			: /*winner*/ ctx[1]?.user.rank_id].name + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(104:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:8) {#if isInactiveGame && !user}
    function create_if_block_1(ctx) {
    	let inlineskeleton;
    	let current;
    	inlineskeleton = new InlineSkeleton({ props: { width: 74 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(inlineskeleton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inlineskeleton, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inlineskeleton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inlineskeleton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inlineskeleton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(102:8) {#if isInactiveGame && !user}",
    		ctx
    	});

    	return block;
    }

    // (114:6) {:else}
    function create_else_block$2(ctx) {
    	let div1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let t1_value = formatMoney(/*winner*/ ctx[1]?.bet_sum) + "";
    	let t1;
    	let t2;
    	let span0;
    	let t4;
    	let div3;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let span1;
    	let t6_value = formatMoney(/*winner*/ ctx[1]?.won_amount) + "";
    	let t6;
    	let t7;
    	let span2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "кол-во ставок";
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			img1 = element("img");
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			span2 = element("span");
    			span2.textContent = "выигрыш";
    			if (!src_url_equal(img0.src, img0_src_value = "assets/images/database_yellow.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "bets amount");
    			attr_dev(img0, "class", "svelte-54gurg");
    			add_location(img0, file$2, 116, 12, 3264);
    			attr_dev(div0, "class", "tournamentWinnerPlatesBetsSum svelte-54gurg");
    			add_location(div0, file$2, 115, 10, 3208);
    			attr_dev(span0, "class", "tournamentWinnerPlatesBetsDescription svelte-54gurg");
    			add_location(span0, file$2, 119, 10, 3401);
    			attr_dev(div1, "class", "tournamentWinnerPlatesBets svelte-54gurg");
    			add_location(div1, file$2, 114, 8, 3157);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/images/coup.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "svelte-54gurg");
    			add_location(img1, file$2, 126, 12, 3631);
    			attr_dev(div2, "class", "tournamentWinnerPlatesCoup svelte-54gurg");
    			add_location(div2, file$2, 125, 10, 3578);
    			attr_dev(span1, "class", "tournamentWinnerPlatesWinAmountCount svelte-54gurg");
    			add_location(span1, file$2, 128, 10, 3703);
    			attr_dev(span2, "class", "tournamentWinnerPlatesWinAmountDescription svelte-54gurg");
    			add_location(span2, file$2, 131, 10, 3829);
    			attr_dev(div3, "class", "tournamentWinnerPlatesWinAmount svelte-54gurg");
    			add_location(div3, file$2, 124, 8, 3522);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, span0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div3, t5);
    			append_dev(div3, span1);
    			append_dev(span1, t6);
    			append_dev(div3, t7);
    			append_dev(div3, span2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winner*/ 2 && t1_value !== (t1_value = formatMoney(/*winner*/ ctx[1]?.bet_sum) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*winner*/ 2 && t6_value !== (t6_value = formatMoney(/*winner*/ ctx[1]?.won_amount) + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(114:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (111:6) {#if isInactiveGame}
    function create_if_block$2(ctx) {
    	let cardskeleton0;
    	let t;
    	let cardskeleton1;
    	let current;
    	cardskeleton0 = new CardSkeleton({ $$inline: true });
    	cardskeleton1 = new CardSkeleton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(cardskeleton0.$$.fragment);
    			t = space();
    			create_component(cardskeleton1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardskeleton0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(cardskeleton1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardskeleton0.$$.fragment, local);
    			transition_in(cardskeleton1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardskeleton0.$$.fragment, local);
    			transition_out(cardskeleton1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardskeleton0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(cardskeleton1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(111:6) {#if isInactiveGame}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div7;
    	let div0;
    	let t0;
    	let div6;
    	let t1;
    	let t2;
    	let div3;
    	let div1;
    	let t3;
    	let div2;
    	let current_block_type_index;
    	let if_block2;
    	let div3_style_value;
    	let t4;
    	let div4;
    	let span0;
    	let current_block_type_index_1;
    	let if_block3;
    	let t5;
    	let span1;
    	let current_block_type_index_2;
    	let if_block4;
    	let t6;
    	let div5;
    	let current_block_type_index_3;
    	let if_block5;
    	let current;
    	let if_block0 = (!/*isInactiveGame*/ ctx[0] || /*user*/ ctx[3]) && create_if_block_5(ctx);
    	let if_block1 = !/*isInactiveGame*/ ctx[0] && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block_3, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isInactiveGame*/ ctx[0] && !/*user*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_2, create_else_block_2];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*isInactiveGame*/ ctx[0] && !/*user*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block3 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	const if_block_creators_2 = [create_if_block_1, create_else_block_1];
    	const if_blocks_2 = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*isInactiveGame*/ ctx[0] && !/*user*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index_2 = select_block_type_2(ctx);
    	if_block4 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    	const if_block_creators_3 = [create_if_block$2, create_else_block$2];
    	const if_blocks_3 = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*isInactiveGame*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index_3 = select_block_type_3(ctx);
    	if_block5 = if_blocks_3[current_block_type_index_3] = if_block_creators_3[current_block_type_index_3](ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div6 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");
    			if_block2.c();
    			t4 = space();
    			div4 = element("div");
    			span0 = element("span");
    			if_block3.c();
    			t5 = space();
    			span1 = element("span");
    			if_block4.c();
    			t6 = space();
    			div5 = element("div");
    			if_block5.c();

    			attr_dev(div0, "class", "tournamentWinnerCardBG " + (/*isWinner*/ ctx[6]
    			? 'tournamentWinnerCardBGWinner'
    			: '') + " svelte-54gurg");

    			add_location(div0, file$2, 34, 2, 957);
    			attr_dev(div1, "class", "tournamentWinnerAvatarLine svelte-54gurg");
    			add_location(div1, file$2, 76, 6, 1960);
    			attr_dev(div2, "class", "tournamentWinnerAvatar svelte-54gurg");
    			add_location(div2, file$2, 77, 6, 2009);
    			attr_dev(div3, "class", "tournamentWinnerAvatarWrapper svelte-54gurg");

    			attr_dev(div3, "style", div3_style_value = `
      ${/*isInactiveGame*/ ctx[0] ? "margin-top: 90px" : ""}
    `);

    			add_location(div3, file$2, 70, 4, 1827);
    			attr_dev(span0, "class", "tournamentWinnerNameFullname svelte-54gurg");
    			add_location(span0, file$2, 93, 6, 2509);
    			attr_dev(span1, "class", "tournamentWinnerNameDescription svelte-54gurg");
    			add_location(span1, file$2, 100, 6, 2769);
    			attr_dev(div4, "class", "tournamentWinnerName svelte-54gurg");
    			add_location(div4, file$2, 92, 4, 2468);
    			attr_dev(div5, "class", "tournamentWinnerPlates svelte-54gurg");
    			add_location(div5, file$2, 109, 4, 3021);
    			attr_dev(div6, "class", "tournamentWinnerCard " + (/*isWinner*/ ctx[6] ? 'tournamentWinnerCardWinner' : '') + " svelte-54gurg");
    			add_location(div6, file$2, 39, 2, 1065);

    			attr_dev(div7, "class", "tournamentWinnerCardWrapper " + (/*isWinner*/ ctx[6]
    			? 'tournamentWinnerCardWrapperWinner'
    			: '') + " svelte-54gurg");

    			add_location(div7, file$2, 29, 0, 848);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			if (if_block0) if_block0.m(div6, null);
    			append_dev(div6, t1);
    			if (if_block1) if_block1.m(div6, null);
    			append_dev(div6, t2);
    			append_dev(div6, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			if_blocks[current_block_type_index].m(div2, null);
    			append_dev(div6, t4);
    			append_dev(div6, div4);
    			append_dev(div4, span0);
    			if_blocks_1[current_block_type_index_1].m(span0, null);
    			append_dev(div4, t5);
    			append_dev(div4, span1);
    			if_blocks_2[current_block_type_index_2].m(span1, null);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			if_blocks_3[current_block_type_index_3].m(div5, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*isInactiveGame*/ ctx[0] || /*user*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div6, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*isInactiveGame*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*isInactiveGame*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div6, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div2, null);
    			}

    			if (!current || dirty & /*isInactiveGame*/ 1 && div3_style_value !== (div3_style_value = `
      ${/*isInactiveGame*/ ctx[0] ? "margin-top: 90px" : ""}
    `)) {
    				attr_dev(div3, "style", div3_style_value);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block3 = if_blocks_1[current_block_type_index_1];

    				if (!if_block3) {
    					if_block3 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block3.c();
    				} else {
    					if_block3.p(ctx, dirty);
    				}

    				transition_in(if_block3, 1);
    				if_block3.m(span0, null);
    			}

    			let previous_block_index_2 = current_block_type_index_2;
    			current_block_type_index_2 = select_block_type_2(ctx);

    			if (current_block_type_index_2 === previous_block_index_2) {
    				if_blocks_2[current_block_type_index_2].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_2[previous_block_index_2], 1, 1, () => {
    					if_blocks_2[previous_block_index_2] = null;
    				});

    				check_outros();
    				if_block4 = if_blocks_2[current_block_type_index_2];

    				if (!if_block4) {
    					if_block4 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    					if_block4.c();
    				} else {
    					if_block4.p(ctx, dirty);
    				}

    				transition_in(if_block4, 1);
    				if_block4.m(span1, null);
    			}

    			let previous_block_index_3 = current_block_type_index_3;
    			current_block_type_index_3 = select_block_type_3(ctx);

    			if (current_block_type_index_3 === previous_block_index_3) {
    				if_blocks_3[current_block_type_index_3].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_3[previous_block_index_3], 1, 1, () => {
    					if_blocks_3[previous_block_index_3] = null;
    				});

    				check_outros();
    				if_block5 = if_blocks_3[current_block_type_index_3];

    				if (!if_block5) {
    					if_block5 = if_blocks_3[current_block_type_index_3] = if_block_creators_3[current_block_type_index_3](ctx);
    					if_block5.c();
    				} else {
    					if_block5.p(ctx, dirty);
    				}

    				transition_in(if_block5, 1);
    				if_block5.m(div5, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			if_blocks_2[current_block_type_index_2].d();
    			if_blocks_3[current_block_type_index_3].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WinnerCard', slots, []);
    	let { isInactiveGame = false } = $$props;
    	let { winner = null } = $$props;
    	let { isUser = false } = $$props;
    	let { user = null } = $$props;
    	const placeMapper = { 1: "1st ", 2: "2nd ", 3: "3rd " };
    	const crownColorMapper = { 1: "#FFBB29", 2: "#FFFFFF", 3: "#7E7E7E" };
    	let isWinner = winner?.tournament_id === 1;
    	const writable_props = ['isInactiveGame', 'winner', 'isUser', 'user'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WinnerCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('isInactiveGame' in $$props) $$invalidate(0, isInactiveGame = $$props.isInactiveGame);
    		if ('winner' in $$props) $$invalidate(1, winner = $$props.winner);
    		if ('isUser' in $$props) $$invalidate(2, isUser = $$props.isUser);
    		if ('user' in $$props) $$invalidate(3, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({
    		AvatarWithBorder,
    		RankIcon,
    		RANKS,
    		formatMoney,
    		AvatarSkeleton,
    		CardSkeleton,
    		InlineSkeleton,
    		TournamentCrown,
    		isInactiveGame,
    		winner,
    		isUser,
    		user,
    		placeMapper,
    		crownColorMapper,
    		isWinner
    	});

    	$$self.$inject_state = $$props => {
    		if ('isInactiveGame' in $$props) $$invalidate(0, isInactiveGame = $$props.isInactiveGame);
    		if ('winner' in $$props) $$invalidate(1, winner = $$props.winner);
    		if ('isUser' in $$props) $$invalidate(2, isUser = $$props.isUser);
    		if ('user' in $$props) $$invalidate(3, user = $$props.user);
    		if ('isWinner' in $$props) $$invalidate(6, isWinner = $$props.isWinner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isInactiveGame, winner, isUser, user, placeMapper, crownColorMapper, isWinner];
    }

    class WinnerCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			isInactiveGame: 0,
    			winner: 1,
    			isUser: 2,
    			user: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WinnerCard",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get isInactiveGame() {
    		throw new Error("<WinnerCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isInactiveGame(value) {
    		throw new Error("<WinnerCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winner() {
    		throw new Error("<WinnerCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<WinnerCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isUser() {
    		throw new Error("<WinnerCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isUser(value) {
    		throw new Error("<WinnerCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get user() {
    		throw new Error("<WinnerCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<WinnerCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/TournamentStuff/TournamentTop3Winners/TournamentTop3Winners.svelte generated by Svelte v3.50.1 */
    const file$1 = "src/pages/TournamentStuff/TournamentTop3Winners/TournamentTop3Winners.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (20:2) {:else}
    function create_else_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*skeletonData*/ ctx[3];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*i*/ ctx[10];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*skeletonData, user_bet*/ 10) {
    				each_value_1 = /*skeletonData*/ ctx[3];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(20:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:2) {#if game.is_active}
    function create_if_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*winners*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*winner*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winners, user_bet*/ 6) {
    				each_value = /*winners*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(13:2) {#if game.is_active}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#each skeletonData as _, i (i)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let winnercard;
    	let current;

    	winnercard = new WinnerCard({
    			props: {
    				isInactiveGame: true,
    				user: /*i*/ ctx[10] === 0 ? /*user_bet*/ ctx[1]?.user : null
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(winnercard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(winnercard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(winnercard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(winnercard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(winnercard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(21:4) {#each skeletonData as _, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#each winners as winner (winner.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let winnercard;
    	let current;

    	winnercard = new WinnerCard({
    			props: {
    				winner: /*winner*/ ctx[5],
    				isUser: /*user_bet*/ ctx[1].tournament_id === /*winner*/ ctx[5].tournament_id
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(winnercard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(winnercard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(winnercard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(winnercard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(winnercard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:4) {#each winners as winner (winner.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*game*/ ctx[0].is_active) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "top3Winners svelte-1i5dmlu");
    			add_location(div, file$1, 11, 0, 274);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TournamentTop3Winners', slots, []);
    	const { leaders, game, user_bet } = getContext("tournamentContext");
    	const winners = leaders.slice(0, 3);
    	const skeletonData = [...Array(3).keys()];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TournamentTop3Winners> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getContext,
    		WinnerCard,
    		leaders,
    		game,
    		user_bet,
    		winners,
    		skeletonData
    	});

    	return [game, user_bet, winners, skeletonData];
    }

    class TournamentTop3Winners extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TournamentTop3Winners",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/Tournament.svelte generated by Svelte v3.50.1 */
    const file = "src/pages/Tournament.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let tournamentheader;
    	let t0;
    	let tournamenttop3winners;
    	let t1;
    	let tournamenttable;
    	let current;
    	tournamentheader = new TournamentHeader({ $$inline: true });
    	tournamenttop3winners = new TournamentTop3Winners({ $$inline: true });
    	tournamenttable = new TournamentTable({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tournamentheader.$$.fragment);
    			t0 = space();
    			create_component(tournamenttop3winners.$$.fragment);
    			t1 = space();
    			create_component(tournamenttable.$$.fragment);
    			attr_dev(main, "class", "svelte-1562z7v");
    			add_location(main, file, 6, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(tournamentheader, main, null);
    			append_dev(main, t0);
    			mount_component(tournamenttop3winners, main, null);
    			append_dev(main, t1);
    			mount_component(tournamenttable, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tournamentheader.$$.fragment, local);
    			transition_in(tournamenttop3winners.$$.fragment, local);
    			transition_in(tournamenttable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tournamentheader.$$.fragment, local);
    			transition_out(tournamenttop3winners.$$.fragment, local);
    			transition_out(tournamenttable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(tournamentheader);
    			destroy_component(tournamenttop3winners);
    			destroy_component(tournamenttable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tournament', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tournament> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		TournamentHeader,
    		TournamentTable,
    		TournamentTop3Winners
    	});

    	return [];
    }

    class Tournament extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tournament",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var game = {
    	id: 4,
    	prizes: [
    		500000,
    		300000,
    		100000,
    		70000,
    		70000,
    		70000,
    		50000,
    		50000,
    		40000,
    		20000,
    		20000,
    		20000,
    		20000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000,
    		10000
    	],
    	deadline: "2023-03-18 11:11:59",
    	created_at: "2023-03-14 16:00:59",
    	is_active: 1,
    	required_coeff: 1.5
    };
    var leaders = [
    	{
    		id: 29975,
    		user_id: 321321,
    		tournament_id: 1,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 299751,
    		user_id: 321321,
    		tournament_id: 2,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 299753,
    		user_id: 321321,
    		tournament_id: 3,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 2997,
    		user_id: 321321,
    		tournament_id: 4,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 299,
    		user_id: 321321,
    		tournament_id: 5,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 291,
    		user_id: 321321,
    		tournament_id: 6,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 292,
    		user_id: 321321,
    		tournament_id: 7,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 293,
    		user_id: 321321,
    		tournament_id: 8,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 294,
    		user_id: 321321,
    		tournament_id: 9,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 2995,
    		user_id: 321321,
    		tournament_id: 10,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 26,
    		user_id: 321321,
    		tournament_id: 11,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 297,
    		user_id: 321321,
    		tournament_id: 12,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	},
    	{
    		id: 29723,
    		user_id: 321321,
    		tournament_id: 13,
    		bet_sum: 22897219,
    		is_win: 1,
    		won_amount: 500000,
    		hidden: 0,
    		user: {
    			id: 321312,
    			username: "Jane Doe",
    			avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    			rank_id: 15
    		}
    	}
    ];
    var user_bet = {
    	id: 29229,
    	user_id: 123123,
    	tournament_id: 2,
    	bet_sum: 46782,
    	is_win: 0,
    	won_amount: 0,
    	hidden: 0,
    	user: {
    		id: 123123,
    		username: "John Doe",
    		avatar: "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&poi=%5B900%2C533%5D&w=2000&h=1333&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F47%2F2021%2F03%2F12%2Fpomeranian-white-puppy-921029690-2000.jpg",
    		rank_id: 14
    	}
    };
    var bet_position = 1106;
    var tournamentData = {
    	game: game,
    	leaders: leaders,
    	user_bet: user_bet,
    	bet_position: bet_position
    };

    /* src/App.svelte generated by Svelte v3.50.1 */

    // (29:0) {:else}
    function create_else_block(ctx) {
    	let tournament;
    	let current;
    	tournament = new Tournament({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tournament.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tournament, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tournament.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tournament.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tournament, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(29:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#if isLoading}
    function create_if_block(ctx) {
    	let preloader;
    	let current;
    	preloader = new Preloader({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(preloader.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(preloader, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(preloader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(preloader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(preloader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(27:0) {#if isLoading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isLoading*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let isLoading = false;

    	// cards.set(raffleData);
    	// setContext("globalContext", testData);
    	// setContext("raffleContext", raffleData);
    	setContext("tournamentContext", tournamentData);

    	// response imitation
    	setTimeout(
    		() => {
    			$$invalidate(0, isLoading = false);
    		},
    		2000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		setContext,
    		Preloader,
    		Tournament,
    		tournamentData,
    		isLoading
    	});

    	$$self.$inject_state = $$props => {
    		if ('isLoading' in $$props) $$invalidate(0, isLoading = $$props.isLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isLoading];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
