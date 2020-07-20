var utils = (function() {
    function randRealRange(min, max) {
        return min + Math.random() * (max - min);
    }
    
    function randIntRange(min, max) {
        return Math.floor(randRealRange(min, max));
    }
    
    function randColor() {
        return '#'
            + (randIntRange(16, 255)).toString(16)
            + (randIntRange(16, 255)).toString(16)
            + (randIntRange(16, 255)).toString(16);
    }
    
    function randConvex(width = 100, height = 100, count = 20) {
        var vertices = [];
        for (var i = 0; i < count; i++) {
            vertices.push(new Vector2f(
                randIntRange(-width / 2, width / 2),
                randIntRange(-height / 2, height / 2)
            ));
        }
        vertices = geometry.convexHull(vertices);
        return vertices;
    }

    return {
        randRealRange,
        randIntRange,
        randColor,
        randConvex
    };
})();

var randRealRange = utils.randRealRange;
var randIntRange = utils.randIntRange;
var randColor = utils.randColor;
var randConvex = utils.randConvex;