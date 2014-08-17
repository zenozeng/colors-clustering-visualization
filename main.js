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

    var width = 960,
        height = 480,
        radius = 5,
        clusterRadius = 15;

    var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

    var pd = 0.4;
    var focusPoints = [
        {x: width * pd, y: height * pd},
        {x: width * pd, y: height * (1 - pd)},
        {x: width * (1 - pd), y: height * pd},
        {x: width * (1 - pd), y: height * (1 - pd)},
    ]

    var n = 4; // 10 clusters
    var clusters = new Array(n); // center for each cluster
    var clusterColors = [
        [255, 196, 178],
        [56, 63, 11],
        [204, 160, 168],
        [111, 125, 16]
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
            d.radius = clusterRadius;
            clusters[i] = d;
        }
        return d;
    });

    var force = d3.layout.force()
            .nodes(nodes)
            .links([])
            .gravity(0)
            .charge(-10)
            .size([width, height])
            .on("tick", tick);

    var circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", function(d) { return d.radius; })
            .style("fill", function(d) { return d.color; })
            .call(force.drag);

    function tick(e) {
        var k = .1 * e.alpha;

        nodes.forEach(function(d, i) {
            var dy = (focusPoints[d.cluster].y - d.y) * k,
                dx = (focusPoints[d.cluster].x - d.x) * k;
            if(clusters[d.cluster] == d) {
                dy *= 1.5;
                dx *= 1.5;
            }
            d.x += dx;
            d.y += dy;
        });

        circle.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    force.start();

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
            .duration(3000)
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
                if(node == cluster) {
                    console.log(["!!", d]);
                }
                if(!minD || d < minD) {
                    minD = d;
                    i = index;
                }
            });
            console.log([n, i, node.cluster == i]);

            node.cluster = i;


            if(n < nodes.length - 1) {
                iter(n+1);
            }

        }
        iter(0);

        force.start();
    }

    var iter = function() {
        updateClusters();
        setTimeout(function() {
            updateNodes();
        }, 3000);
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


