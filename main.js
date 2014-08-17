var readColors = function(ctx, width, height, mosaicWidth, mosaicHeight) {
    var colors = [];
    for(var x = 0; x < width; x += mosaicWidth) {
        for(var y = 0; y < height; y += mosaicHeight) {
            var rgba = ctx.getImageData(x, y, 1, 1).data;
            // note: rgba is Uint8ClampedArray
            colors.push([rgba[0], rgba[1], rgba[2]]);
        }
    }
    return colors;
}

var mosaic = function(ctx, width, height, mosaicWidth, mosaicHeight) {
    for(var x = 0; x < width; x += mosaicWidth) {
        for(var y = 0; y < height; y += mosaicHeight) {
            var rgba = ctx.getImageData(x, y, 1, 1).data;
            // note: rgba is Uint8ClampedArray
            ctx.fillStyle = "rgba(" + [rgba[0], rgba[1], rgba[2], rgba[3]].join(',') + ")";
            ctx.fillRect(x, y, mosaicWidth, mosaicHeight);
        }
    }
}

var distance = function(a, b) {
    var sum = 0;
    a.forEach(function(elem, i) {
        sum += Math.pow(elem - b[i], 2);
    });
    return sum;
}

var drawClusters = function(colors) {

    console.log(colors);

    var width = 900,
        height = 500,
        padding = 2, // padding for circles in same cluster
        clusterPadding = 40, // padding for circles in different cluster
        radius = 5,
        clusterRadius = 20;

    var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

    var n = 5; // 10 clusters
    var clusters = new Array(n); // center for each cluster
    var clusterColors = [
        [193, 196, 178],
        [56, 63, 11],
        [204, 160, 168],
        [111, 125, 16],
        [39, 39, 31]
    ];

    var nodes = colors.map(function(rgb, index) {
        var i;
        var minD = null;
        clusterColors.forEach(function(color, index) {
            var d = distance(color, rgb);
            if(!minD || d < minD) {
                minD = d;
                i = index;
            }
        });
        var d = {cluster: i, radius: radius, color: "rgba("+rgb.join(',')+",1)", rgb: rgb};
        if(minD < 270 && !clusters[i]) {
            console.log(d);
            d.radius = clusterRadius;
            clusters[i] = d;
        }
        return d;
    });

    var force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(.02)
            .charge(0)
            .on("tick", tick)
            .start();

    var circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", function(d) { return d.radius; })
            .style("fill", function(d) { return d.color; })
            .call(force.drag);

    function tick(e) {
        circle
            .each(cluster(10 * e.alpha * e.alpha))
            .each(collide(.5))
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    // Move d to be adjacent to the cluster node.
    function cluster(alpha) {
        return function(d) {
            var cluster = clusters[d.cluster];
            if (cluster === d) return;
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
                l = (l - r) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
            }
        };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function(d) {
            var r = d.radius + clusterRadius + Math.max(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }

    var updateClusters = function() {
        var newCluster;
        for(var i = 0; i < n; i++) {
            // update cluster
            var _nodes = nodes.filter(function(node) {
                return node.cluster == i;
            })
            var rgbs = _nodes.map(function(node) {
                return node.rgb;
            });
            var r = 0,
                g = 0,
                b = 0;

            rgbs.forEach(function(elem) {
                r += elem[0];
                g += elem[1];
                b += elem[2];
            });

            r /= rgbs.length;
            g /= rgbs.length;
            b /= rgbs.length;

            var minD = null;
            _nodes.forEach(function(node) {
                var d = distance(node.rgb, [r, g, b]);
                if(!minD || d < minD) {
                    minD = d;
                    newCluster = node;
                }
            });

            clusters[i].radius = radius;
            newCluster.radius = clusterRadius;
            clusters[i] = newCluster;
        }

        svg.selectAll("circle")
            .data(nodes)
            .transition()
            .duration(5000)
            .attr("r", function(d) {
                return d.radius;
            });

    }

    var updateNodes = function() {
        var iter = function(n) {
            var node = nodes[n];

            var i;
            var minD = null;
            clusters.forEach(function(cluster, index) {
                var d = distance(cluster.rgb, node.rgb);
                if(!minD || d < minD) {
                    minD = d;
                    i = index;
                }
            });
            node.cluster = i;

            if(n < nodes.length - 1) {
                iter(n+1);
            }
        }
        iter(0);
    }

    var iter = function() {
        updateClusters();
        setTimeout(function() {
            updateNodes();
        }, 5000);
    }

    document.querySelector('#iter').onclick = function() {
        iter();
    }

}


var img = new Image();
img.src = "demo.jpg";
img.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width * 2, img.height * 2);
    mosaic(ctx, canvas.width, canvas.height, 20, 20);
    var colors = readColors(ctx, canvas.width, canvas.height, 20, 20);

    drawClusters(colors);
}


