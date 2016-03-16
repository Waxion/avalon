var Cache = require('../seed/cache')
var textCache = new Cache(128)
avalon.textCache = textCache
avalon.directive('html', {
    parse: function (binding, num) {
        return 'vnode' + num + '.htmlVm = __vmodel__\n' +
                'vnode' + num + '.props.wid = 1;\n' +
                'vnode' + num + '.props["a-html"] =' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var curValue = cur.props['a-html']
        var preValue = pre.props['a-html']
        if (curValue !== preValue) {

            var nodes = textCache.get(curValue)
            if (!Array.isArray(nodes)) {
                var child = avalon.lexer(curValue)
                var render = avalon.render(child)
                nodes = render(cur.htmlVm)
                curValue = cur.props['a-html'] = nodes.map(function (el) {
                    return 'template' in el ? el.template : el.nodeValue
                }).join('-')
                textCache.put(curValue, nodes)
            }
            cur.children = nodes
            if (cur.props['a-html'] !== preValue) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
    },
    update: function (node, vnode) {
        if (node.querySelectorAll) {
            var nodes = node.querySelectorAll('[avalon-events]')
            avalon.each(nodes, function (el) {
                avalon.unbind(el)
            })
        } else {
            var nodes = node.getElementsByTagName('*')
            avalon.each(nodes, function (el) {
                if (el.getAttribute('avalon-events')) {
                    avalon.unbind(el)
                }
            })
        }
        //添加节点
        if (window.Range) {
            node.innerHTML = vnode.children.map(function (c) {
                return avalon.vdomAdaptor(c).toHTML()
            }).join('')
        } else {
            avalon.clearHTML(node)
            var fragment = document.createDocumentFragment()
            vnode.children.forEach(function (c) {
                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
            })

            node.appendChild(fragment)
        }
    }
})