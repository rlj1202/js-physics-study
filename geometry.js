// Geometry object
// 
// Author: Jisu Sim
// Date: 2020.05.28
var geometry = (function() {
    'use strict';

    /**
     * Get barycentric coordinates of a line.
     * @param {Vector2f} a
     * @param {Vector2f} b
     * @param {Vector2f} q - Query point.
     */
    function getUV(a, b, q) {
        var dir = b.sub(a);
        var len = dir.length();
        var u = (b.sub(q)).dot(dir) / len / len;
        var v = (q.sub(a)).dot(dir) / len / len;

        return { u: u, v: v };
    }

    /**
     * Get barycentric coordinates of a triangle.
     * @param {Vector2f} a
     * @param {Vector2f} b
     * @param {Vector2f} c
     * @param {Vector2f} q - Query point.
     */
    function getUVW(a, b, c, q) {
        var area = b.sub(a).cross(c.sub(a)) / 2;
        var v = c.sub(q).cross(a.sub(q)) / 2 / area;
        var u = b.sub(q).cross(c.sub(q)) / 2 / area;
        var w = a.sub(q).cross(b.sub(q)) / 2 / area;

        return { u: u, v: v, w: w };
    }

    /**
     * Get closest point of 0-simplex about q.
     * (Actually, this function is absolutely meaningless. Just for a concept.)
     * @param {Vector2f} a - Simplex vertex.
     * @param {Vector2f} q - Query point.
     */
    function getClosestPoint0(a, q) {
        return a;
    }

    /**
     * Get closest point of 1-simplex about q.
     * @param {Vector2f} a - Simplex vertex.
     * @param {Vector2f} b - Simplex vertex.
     * @param {Vector2f} q - Query point.
     */
    function getClosestPoint1(a, b, q) {
        var { u, v } = getUV(a, b, q);

        if (v <= 0) return a;
        else if (u <= 0) return b;
        else return a.mul(u).add(b.mul(v));
    }

    /**
     * Get closest point of 2-simplex about q.
     * @param {Vector2f} a - Vertex
     * @param {Vector2f} b - Vertex
     * @param {Vector2f} c - Vertex
     * @param {Vector2f} q - Query point
     */
    function getClosestPoint2(a, b, c, q) {
        var { u: uAB, v: vAB } = getUV(a, b, q);
        var { u: uBC, v: vBC } = getUV(b, c, q);
        var { u: uCA, v: vCA } = getUV(c, a, q);
        var { u: uABC, v: vABC, w: wABC } = getUVW(a, b, c, q);

        // Check vertex regions
        if (uCA <= 0 && vAB <= 0) return a;
        else if (uAB <= 0 && vBC <= 0) return b;
        else if (uBC <= 0 && vCA <= 0) return c;

        // Check edge regions
        if (uBC > 0 && vBC > 0 && uABC <= 0) return b.mul(uBC).add(c.mul(vBC));
        else if (uCA > 0 && vCA > 0 && vABC <= 0) return c.mul(uCA).add(a.mul(vCA));
        else if (uAB > 0 && vAB > 0 && wABC <= 0) return a.mul(uAB).add(b.mul(vAB));

        // Interior region
        return q;
    }

    /**
     * Get closest point of a convex polygon.
     * Using GJK algorithm.
     * @param {Vector2f[]} vertices - Polygon should be representing a convex polygon.
     * @param {Vector2f} q - Query point.
     */
    function getClosestPointConvex(vertices, q) {
        // Simplex
        var a = vertices[0];
        var b = null;
        var c = null;
        var simplexCount = 1;

        // Closest point
        var p = q;

        var i = 100; // XXX Infinite loop prevention.
        while (i-- > 0) {
            // Get closest point of simplex.
            // And cull non-contributing vertices from simplex.
            if (simplexCount == 1) {
                p = a;
            } else if (simplexCount == 2) {
                var { u, v } = getUV(a, b, q);

                if (v < 0) {
                    p = a;

                    simplexCount = 1;
                } else if (u < 0) {
                    p = b;

                    simplexCount = 1;
                    a = b;
                } else {
                    p = a.mul(u).add(b.mul(v));
                }
            } else if (simplexCount == 3) {
                var { u: uAB, v: vAB } = getUV(a, b, q);
                var { u: uBC, v: vBC } = getUV(b, c, q);
                var { u: uCA, v: vCA } = getUV(c, a, q);
                var { u: uABC, v: vABC, w: wABC } = getUVW(a, b, c, q);
        
                if (uCA <= 0 && vAB <= 0) { // Check vertex regions
                    p = a;

                    simplexCount = 1;
                } else if (uAB <= 0 && vBC <= 0) {
                    p = b;

                    simplexCount = 1;
                    a = b;
                } else if (uBC <= 0 && vCA <= 0) {
                    p = c;

                    simplexCount = 1;
                    a = c;
                } else if (uBC > 0 && vBC > 0 && uABC <= 0) { // Check edge regions
                    p = b.mul(uBC).add(c.mul(vBC));

                    simplexCount = 2;
                    a = b;
                    b = c;
                } else if (uCA > 0 && vCA > 0 && vABC <= 0) {
                    p = c.mul(uCA).add(a.mul(vCA));

                    simplexCount = 2;
                    b = c;
                } else if (uAB > 0 && vAB > 0 && wABC <= 0) {
                    p = a.mul(uAB).add(b.mul(vAB));

                    simplexCount = 2;
                } else { // Interior region
                    // Termination condition: containment in simplex.
                    p = q;
                    break;
                }
            }
            
            var d = q.sub(p);

            if (d.equals(new Vector2f(0, 0))) {
                // Termination condition: vertex overlap.
                break;
            }

            var support = getFarthestPoint(vertices, d);

            // Add support point to simplex.
            if (simplexCount == 1) {
                if (a != support) {
                    simplexCount = 2;
                    b = support;
                } else {
                    // Termination condition: repeated support point.
                    break;
                }
            } else if (simplexCount == 2) {
                if (a != support && b != support) {
                    simplexCount = 3;
                    c = support;
                } else {
                    // Termination condition: repeated support point.
                    break;
                }
            } else {
                console.log('Termination error: not simplex');
                break;
            }
        }

        if (i == 0) console.log('Termination error: infinite loop');

        return p;
    }

    /**
     * Get farthest point of vertices about direction vector d.
     * @param {Vector2f[]} vertices
     * @param {Vector2f} d
     */
    function getFarthestPoint(vertices, d, offset = Vector2f.ZERO, rotate = 0) {
        var result = 0;
        var max = d.dot(vertices[result].rotate(rotate).add(offset));
        for (var i = 1; i < vertices.length; i++) {
            var value = d.dot(vertices[i].rotate(rotate).add(offset));
            if (value > max) {
                result = i;
                max = value;
            }
        }
        return vertices[result].rotate(rotate).add(offset);
    }

    /**
     * Get outline of vertices.
     * @param {Vector2f[]} vertices
     */
    function convexHull(vertices) {
        if (vertices.length < 4) return vertices;

        // Shallow copy an array.
        var result = vertices.slice();

        // Get minimum vertex.
        var min = result[0];
        for (var i in result) {
            if (result[i].y < min.y)
                min = result[i];
            else if (result[i].y == min.y && result[i].x < min.x)
                min = result[i];
        }

        // Sort vertices anticlockwise.
        result.sort((a, b) => {
            if (a == min) return -1;
            if (b == min) return 1;
            if (a == min && b == min) return 0;

            return b.sub(min).cross(a.sub(min));
        });

        // Do convex hull.
        var stack = [result[0], result[1]];
        for (var i = 2; i < result.length; i++) {
            var cur = result[i];

            while (stack.length > 1) {
                var a = stack[stack.length - 2];
                var b = stack[stack.length - 1];
                var c = cur;

                var cross = b.sub(a).cross(c.sub(b));

                if (cross > 0 || (cross == 0 && (b.sub(a)).length() > (c.sub(a)).length()))
                    break;

                stack.pop();
            }
            stack.push(cur);
        }

        return stack;
    }
	
	/**
	 * Test whether given point in in convex polygon.
	 * @param {Vector2f[]} vertices - Convex polygon.
	 * @param {Vector2f} q - Query point.
	 */
	function gjkTest(vertices, q, offset = Vector2f.ZERO, rotate = 0) {
		var result = false;
		var msg = '';
		
		// Simplex
		var a = vertices[0].rotate(rotate).add(offset); // Choose random vertex.
		var b = null;
		var c = null;
		var simplexCount = 1;
		
		var p;          // closest point.
		var d;          // direction vector from p to q.
		var support;    // support point.
        var contribute; // vertices contribute to simplex.
        
		// XXX Prevent infinite loop caused by my mistake ;D
		var i = 400;
		var history = []; // XXX For debug
		
		while (i > 0) {
            i--;
            
            // Get closest point of simplex.
            // And cull non-contribute vertices.
			p = q;
			if (simplexCount == 1) {
                var { p: np, d: nd, contribute: con } = evolveSimplex0(
                    new SimplexVertex(a, Vector2f.ZERO),
                    q);
                p = np.getVertex();
                d = nd;
                contribute = con;
			} else if (simplexCount == 2) {
				var { p: np, d: nd, contribute: con } = evolveSimplex1(
                    new SimplexVertex(a, Vector2f.ZERO),
                    new SimplexVertex(b, Vector2f.ZERO),
                    q);
				p = np.getVertex();
                d = nd;
                contribute = con;
			} else if (simplexCount == 3) {
				var { p: np, d: nd, contribute: con } = evolveSimplex2(
                    new SimplexVertex(a, Vector2f.ZERO),
                    new SimplexVertex(b, Vector2f.ZERO),
                    new SimplexVertex(c, Vector2f.ZERO),
                    q);
				p = np.getVertex();
				d = nd;
				contribute = con;
            }
            a = contribute[0] ? contribute[0].getVertex() : null;
			b = contribute[1] ? contribute[1].getVertex() : null;
			c = contribute[2] ? contribute[2].getVertex() : null;
			simplexCount = contribute.length;
			
            // Test whether simplex contains query point or not.
            if (simplexCount == 1) {
                if (a.equals(q)) {
                    result = true;
                    msg = 'vertex overlap';
                    break;
                }
            } else if (simplexCount == 2) {
				var { u, v } = getUV(a, b, q);
				
				if (u >= 0 && v >= 0 && q.sub(a).cross(b.sub(a)) == 0) {
					result = true;
					msg = 'edge overlap';
					break;
				}
			} else if (simplexCount == 3) {
				var { u, v, w } = getUVW(a, b, c, q);
				
				if (u >= 0 && v >= 0 && w >= 0) {
					result = true;
					msg = 'containment';
					break;
				}
			}
			
			if (d.equals(Vector2f.ZERO)) {
				result = true;
				msg = 'vertex or edge overlap';
				break;
			}
			
			// Find support point
			support = getFarthestPoint(vertices, d, offset, rotate);
            
            // XXX For debug
			var forDebug = 'bug: ' + simplexCount + ', '
				+ 'a: (' + a.x + ', ' + a.y + '), '
				+ (simplexCount > 1 ? 'b: (' + b.x + ', ' + b.y + '), ' : '')
				+ (simplexCount > 2 ? 'c: (' + c.x + ', ' + c.y + '), ' : '')
				+ 'q: (' + q.x + ', ' + q.y + '), '
				+ 's: (' + support.x + ', ' + support.y + '), '
				+ 'd: (' + d.x + ', ' + d.y + '), '
				+ 'p: (' + p.x + ', ' + p.y + '), '
				+ support.sub(q).dot(d)
				;
			// console.log(forDebug);
			
            // Test whether support point is repeated.
            if (a.equals(support) || (b && b.equals(support)) || (c && c.equals(support))) {
                result = false;
                msg = 'repeated support point';
                break;
            }

            // Add support point to simplex.
			if (simplexCount == 1) {
				simplexCount++;
				b = support;
			} else if (simplexCount == 2) {
				simplexCount++;
				c = support;
			}
            
            // XXX For debug
			history.push({
				simplex: [a, b, c].slice(0, simplexCount),
				forDebug,
				d,
				p,
				support,
				contribute
			});
		}
		
		if (i == 0) { // XXX I mistaked! Find the bug!
            msg = 'bug';
            console.error(history);
            throw forDebug;
		}
		
		return {
			result,
			simplex: [a, b, c].slice(0, simplexCount),
			msg,
			
			d,
			p,
			support
		};
    }

    /**
     * Simplex vertex.
     * @param {Vector2f} a 
     * @param {Vector2f} b 
     */
    function SimplexVertex(a, b = Vector2f.ZERO) {
        this.a = a;
        this.b = b;
        this.vertex = a.sub(b);
    }
    SimplexVertex.prototype = {
        getVertex() {
            return this.vertex;
        },
        add(o) {
            return new SimplexVertex(this.a.add(o.a), this.b.add(o.b));
        },
        sub(o) {
            return new SimplexVertex(this.a.sub(o.a), this.b.sub(o.b));
        },
        mul(c) {
            return new SimplexVertex(this.a.mul(c), this.b.mul(c));
        },
        div(c) {
            return new SimplexVertex(this.a.div(c), this.b.div(c));
        },

        equals(o) {
            return this.getVertex().equals(o.getVertex());
        }
    };

    /**
     * Evolve simplex about query point q.
     * @param {SimplexVertex} a - Simplex vertex.
     * @param {Vector2f} q - Query point.
     * @return {Object} The closest point q, the direction vector from p to q d,
     *                  The contribute vertices contribute.
     */
    function evolveSimplex0(a, q) {
        var p = a;
        var d = q.sub(p.getVertex());
        var contribute = [a];
        return { p, d, contribute };
    }
	
    /**
     * Evolve simplex about query point q.
     * @param {SimplexVertex} a
     * @param {SimplexVertex} b
     * @param {Vector2f} q - Query point.
     * @return {Object} The closest point q, the direction vector from p to q d,
     *                  The contribute vertices contribute.
     */
    function evolveSimplex1(a, b, q) {
        var { u, v } = getUV(a.getVertex(), b.getVertex(), q);
		
		var p = null;
        var d = null;
        var contribute = null;

        if (v < 0) { // This statement should not containt equal operator. if v = 0,
			p = a;   // [a, b] should be contribute.
            d = q.sub(p.getVertex());
            contribute = [a];
        } else if (u < 0) {
			p = b;
            d = q.sub(p.getVertex());
            contribute = [b];
		} else {
			p = a.mul(u).add(b.mul(v));
			d = a.sub(b).getVertex();
			d = new Vector2f(-d.y, d.x);
			if (d.dot(q.sub(a.getVertex())) < 0)
                d = d.mul(-1);
            contribute = [a, b];
		}
		
		return { p, d, contribute };
    }
	
    /**
     * Evolve simplex about query point q.
     * @param {SimplexVertex} a - Vertex
     * @param {SimplexVertex} b - Vertex
     * @param {SimplexVertex} c - Vertex
     * @param {Vector2f} q - Query point
     * @return {Object} The closest point p, the direction vector from p to q d,
     *                  The contribution vertices contribute.
     */
    function evolveSimplex2(a, b, c, q) {
        var { u: uAB, v: vAB } = getUV(a.getVertex(), b.getVertex(), q);
        var { u: uBC, v: vBC } = getUV(b.getVertex(), c.getVertex(), q);
        var { u: uCA, v: vCA } = getUV(c.getVertex(), a.getVertex(), q);
        var { u: uABC, v: vABC, w: wABC } = getUVW(a.getVertex(), b.getVertex(), c.getVertex(), q);
		
		var p = null;
		var d = null;
		var contribute = null;

        if (uCA <= 0 && vAB <= 0) { // Check vertex regions
			p = a;
			d = q.sub(p.getVertex());
			contribute = [a];
		} else if (uAB <= 0 && vBC <= 0) {
			p = b;
			d = q.sub(p.getVertex());
			contribute = [b];
		} else if (uBC <= 0 && vCA <= 0) {
			p = c;
			d = q.sub(p.getVertex());
			contribute = [c];
		} else if (uBC > 0 && vBC > 0 && uABC <= 0) { // Check edge regions
			p = b.mul(uBC).add(c.mul(vBC));
			d = b.sub(c).getVertex();
			d = new Vector2f(-d.y, d.x);
			if (d.dot(q.sub(b.getVertex())) < 0)
				d = d.mul(-1);
			contribute = [b, c];
        } else if (uCA > 0 && vCA > 0 && vABC <= 0) {
			p = c.mul(uCA).add(a.mul(vCA));
			d = c.sub(a).getVertex();
			d = new Vector2f(-d.y, d.x);
			if (d.dot(q.sub(c.getVertex())) < 0)
				d = d.mul(-1);
			contribute = [c, a];
		} else if (uAB > 0 && vAB > 0 && wABC <= 0) {
			p = a.mul(uAB).add(b.mul(vAB));
			d = a.sub(b).getVertex();
			d = new Vector2f(-d.y, d.x);
			if (d.dot(q.sub(a.getVertex())) < 0)
				d = d.mul(-1);
			contribute = [a, b];
		} else { // Interior region
			p = new SimplexVertex(q, Vector2f.ZERO);
			d = new Vector2f();
			contribute = [a, b, c];
		}
		
		return { p, d, contribute }
    }

    /**
     * Get support point.
     * @param {Vector2f[]} cvxA 
     * @param {Vector2f[]} cvxB 
     * @param {Vector2f} d 
     * @param {Vector2f} offsetA 
     * @param {Vector2f} offsetB 
     * @param {Number} rotateA 
     * @param {Number} rotateB 
     * @return {SimplexVertex}
     */
    function getSupportPoint(
        cvxA, cvxB, d,
        offsetA = Vector2f.ZERO, offsetB = Vector2f.ZERO,
        rotateA = 0, rotateB = 0) {
        return new SimplexVertex(
            getFarthestPoint(cvxA, d           , offsetA, rotateA),
            getFarthestPoint(cvxB, d.negative(), offsetB, rotateB));
    }
    
    /**
     * Test wheter given two convex polygons are intersecting or not.
     * @param {Vector2f[]} cvxA - Vertices of convex shape A.
     * @param {Vector2f[]} cvxB - Vertices of convex shape B.
     * @return {Object} The boolean value result which determines given two polygons
     *                  are intersecting or not, the simplex, the msg.
     */
    function gjkTestConvex(
        cvxA, cvxB,
        offsetA = Vector2f.ZERO, offsetB = Vector2f.ZERO,
        rotateA = 0, rotateB = 0) {
        // support(A - B, d) = support(A, d) - support(B, -d);

        var result = false;
        var msg = '';

        var d = new Vector2f(1, 0); // Get a random direction vector.
        var support;
        var contribute;

        // Simplex vertices
        var a = getSupportPoint(cvxA, cvxB, d, offsetA, offsetB, rotateA, rotateB);
        var b = null;
        var c = null;
        var simplexCount = 1;

        // XXX Preventing infinite loop caused by my mistake.
        var i = 400;
        while (i > 0) {
            i--;

            // Get closest point of minkowski difference.
            // And cull non-contribute vertices.
            if (simplexCount == 1) {
                var { d: d, contribute: contribute } = evolveSimplex0(a, Vector2f.ORIGIN);
            } else if (simplexCount == 2) {
                var { d: d, contribute: contribute } = evolveSimplex1(a, b, Vector2f.ORIGIN);
            } else if (simplexCount == 3) {
                var { d: d, contribute: contribute } = evolveSimplex2(a, b, c, Vector2f.ORIGIN);
            }
            a = contribute[0];
            b = contribute[1];
            c = contribute[2];
            simplexCount = contribute.length;

            // Test whether simplex contains origin or not.
            if (simplexCount == 1) {
                if (a.getVertex().equals(Vector2f.ORIGIN)) {
                    result = true;
                    msg = 'vertex overlap';
                    break;
                }
            } else if (simplexCount == 2) {
				var { u, v } = getUV(a.getVertex(), b.getVertex(), Vector2f.ORIGIN);
				
				if (u >= 0 && v >= 0 && Vector2f.ORIGIN.sub(a.getVertex()).cross(b.sub(a).getVertex()) == 0) {
					result = true;
					msg = 'edge overlap';
					break;
				}
			} else if (simplexCount == 3) {
				var { u, v, w } = getUVW(a.getVertex(), b.getVertex(), c.getVertex(), Vector2f.ORIGIN);
				
				if (u >= 0 && v >= 0 && w >= 0) {
					result = true;
					msg = 'containment';
					break;
				}
            }

            if (d.equals(Vector2f.ZERO)) {
				result = true;
				msg = 'vertex or edge overlap';
				break;
			}
			
			// Find support point
            support = getSupportPoint(cvxA, cvxB, d, offsetA, offsetB, rotateA, rotateB);
            
            // Test whether support point is repeated.
            if (a.equals(support) || (b && b.equals(support)) || (c && c.equals(support))) {
                result = false;
                msg = 'repeated support point';
                break;
            }

            // Add support point to simplex.
			if (simplexCount == 1) {
				simplexCount++;
				b = support;
			} else if (simplexCount == 2) {
				simplexCount++;
				c = support;
			}
        }

        if (i == 0) msg = 'bug';

        return { result, simplex: [a, b, c].slice(0, simplexCount), msg };
    }

    /**
     * Find closest edge about query point q.
     * @param {SimplexVertex[]} vertices - Vertices consisting convex shape.
     * @param {Vector2f} q - Query point.
     * @return {Object} The distance between q and the edge, the perpendicular direction vector
     *                  towards q, head and tail vertex indices of an edge.
     */
    function findClosestEdge(vertices, q) {
        var min = Infinity;
        var head = 0;
        var tail = 0;
        var perp = Vector2f.ZERO;

        for (var i = 0; i < vertices.length; i++) {
            var j = i + 1;
            if (j == vertices.length) j = 0;

            var a = vertices[i];
            var b = vertices[j];

            var ab = b.sub(a).getVertex();
            var aq = q.sub(a.getVertex());
            var distance = Math.abs(ab.cross(aq) / ab.length());

            if (min > distance) {
                min = distance;
                head = j;
                tail = i;
                perp = ab.copy();
                perp.set(-perp.y, perp.x);
                if (aq.dot(perp) < 0) perp.negate();
            }
        }

        return { distance: min, perp, head, tail };
    }

    /**
     * Get MTV by expanding simplex gathered by gjk algorithm.
     * @param {Vector2f[]} cvxA
     * @param {Vector2f[]} cvxB
     * @param {Vector2f[]} simplex
     * @return {Object}
     */
    function epa(cvxA, cvxB, simplex,
        offsetA = Vector2f.ZERO, offsetB = Vector2f.ZERO,
        rotateA = 0, rotateB = 0) {
        // support(A - B, d) = support(A, d) - support(B, -d);

        var __original = simplex.slice(0);
        var __history = [];

        var mtv = Vector2f.ZERO;
        var msg = '';
        var d = 0;
        var collisionPoint = new SimplexVertex(Vector2f.ZERO);

        if (simplex.length == 1) { // vertex
            mtv = Vector2f.ZERO;
        } else if (simplex.length == 2) { // line segment
            mtv = Vector2f.ZERO;
        } else if (simplex.length == 3) { // triangle
            // XXX Preventing infinite loop caused by my mistake.
            var i = 100;
            while (i > 0) {
                i--;

                // Get information of closest edge of simplex about origin.
                var { distance, perp, head, tail } = findClosestEdge(simplex, Vector2f.ORIGIN);
                perp = perp.norm().negative();

                // Get new support point in normal direction of the edge.
                var support = getSupportPoint(cvxA, cvxB, perp, offsetA, offsetB, rotateA, rotateB);

                __history.push(support);

                var proj = support.getVertex().dot(perp);
                if (Math.abs(proj - distance) < 0.001) { // XXX tolerance
                    mtv = perp.mul(distance);
                    // TODO using head and tail get SimplexVertex which mtv pointing at. (2020/06/04)
                    var { u, v } = getUV(simplex[head].getVertex(), simplex[tail].getVertex(), Vector2f.ZERO);
                    collisionPoint = simplex[head].mul(u).add(simplex[tail].mul(v));

                    d = distance;
                    break;
                } else {
                    // Add support point to simplex
                    // When add support point to simplex, be careful to maintain simplex to be
                    // convex shape.
                    simplex.splice(head, 0, support);
                }
            }

            if (i == 0) {
                msg = 'bug';
                console.error(simplex);
                console.error(__original);
                console.error(__history);
                throw 'bug';
            }
        }

        return { mtv, msg, polytope: simplex, distance: d, collisionPoint };
    }

    return {
        getUV,
        getUVW,
        getClosestPoint0,
        getClosestPoint1,
        getClosestPoint2,
        getClosestPointConvex,
        convexHull,
        gjkTest,
        gjkTestConvex,
        findClosestEdge,
        epa,

        SimplexVertex
    }
})();

var SimplexVertex = geometry.SimplexVertex;