// Copyright (c) 2020 Jisu Sim. All rights reserved.
// Actually, anyone can use this source code. ;D
(function () {
    'use strict';

    function PhysicsGame() {
        this.Circle = (function () {
            function Circle(position, velocity, radius, mass, color = '#00aa00') {
                this.position = position;
                this.velocity = velocity;
                this.accel = new Vector2f(0, 0);
                this.radius = radius;
                this.mass = mass;
                this.color = color;
            }
            Circle.prototype = {
                update(gameEngine, deltaTime) {
                    var newPosition = this.position.add(this.velocity.mul(deltaTime));
                    var newVelocity = this.velocity.add(this.accel.mul(deltaTime));

                    this.position = newPosition;
                    this.velocity = newVelocity;
                },
                draw(gameEngine, ctx) {
                    ctx.beginPath();
                    ctx.ellipse(
                        this.position.x, this.position.y,
                        this.radius, this.radius,
                        0, 0, Math.PI * 2, false
                    );
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();

                    ctx.fillStyle = '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.fillText('m = ' + this.mass.toFixed(2), this.position.x, this.position.y);
                },
            };
            return Circle;
        })();
    }
    PhysicsGame.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.circles = [];
            for (var i = 0; i < 20; i++) {
                var radius = randRealRange(25, 50);
                var mass = randRealRange(1, 100);
                var color = randColor();
                this.circles.push(new this.Circle(
                    new Vector2f(
                        randRealRange(radius, gameEngine.width - radius),
                        randRealRange(radius, gameEngine.height - radius)),
                    new Vector2f(
                        randRealRange(-0.1, 0.1),
                        randRealRange(-0.1, 0.1)),
                    radius, mass, color));
            }
        },
        update(gameEngine, deltaTime) {
            for (var i in this.circles) {
                this.circles[i].update(gameEngine, deltaTime);
            }

            for (var i in this.circles) {
                var circle = this.circles[i];
                var pos = circle.position;
                var vel = circle.velocity;
                if (pos.x < circle.radius) {
                    pos.x = circle.radius;
                    vel.x *= -1;
                }
                if (pos.y < circle.radius) {
                    pos.y = circle.radius;
                    vel.y *= -1;
                }
                if (pos.x >= gameEngine.width - circle.radius) {
                    pos.x = gameEngine.width - circle.radius;
                    vel.x *= -1;
                }
                if (pos.y >= gameEngine.height - circle.radius) {
                    pos.y = gameEngine.height - circle.radius;
                    vel.y *= -1;
                }
            }

            for (var i = 0; i < this.circles.length; i++) {
                var A = this.circles[i];
                for (var j = i + 1; j < this.circles.length; j++) {
                    var B = this.circles[j];

                    var distance = A.position.sub(B.position).length();
                    if (distance < A.radius + B.radius) {
                        var relativeVelocity = (A.velocity.sub(B.velocity));
                        var dir = A.position.sub(B.position).norm();

                        var impulse = relativeVelocity.dot(dir)
                            * 2 * (A.mass * B.mass) / (A.mass + B.mass);

                        A.velocity = A.velocity.add(dir.mul(-impulse / A.mass));
                        B.velocity = B.velocity.add(dir.mul(impulse / B.mass));

                        var gap = A.radius + B.radius - distance;

                        A.position = A.position.add(dir.mul(gap / 2));
                        B.position = B.position.add(dir.mul(-gap / 2));
                    }
                }
            }
        },
        draw(gameEngine, ctx) {
            for (var i in this.circles) {
                this.circles[i].draw(gameEngine, ctx);
            }
        },
        onKeyDown(e) { },
        onKeyUp(e) { },
        onMouseDown(e) { },
        onMouseUp(e) { },
        onMouseMove(e) { }
    });
    PhysicsGame.prototype.constructor = PhysicsGame;

    function Physics2() {
        this.Entity = (function () {
            function Entity(
                position, velocity,
                angle, angularVelocity,
                mass, vertices,
                color = '#00aa00') {
                this.position = position;
                this.velocity = velocity;
                this.accel = new Vector2f(0, 0);

                this.angle = angle;
                this.angularVelocity = angularVelocity;
                this.angularAccel = 0;

                this.mass = mass;

                var maxRadius = 0;
                for (var i in vertices) {
                    var vertex = vertices[i];
                    maxRadius = Math.max(maxRadius, vertex.length());
                }

                this.inertia = this.mass * (maxRadius * maxRadius); // TODO

                this.vertices = vertices;

                this.color = color;
            }
            Entity.prototype = {
                update(gameEngine, deltaTime) {
                    var newPosition = this.position.add(this.velocity.mul(deltaTime));
                    var newVelocity = this.velocity.add(this.accel.mul(deltaTime));

                    var newAngle = this.angle + this.angularVelocity * deltaTime;

                    this.position = newPosition;
                    this.velocity = newVelocity;

                    this.angle = newAngle;
                },
                draw(gameEngine, ctx) {
                    ctx.beginPath();
                    ctx.translate(this.position.x, this.position.y);
                    ctx.rotate(this.angle);
                    ctx.moveTo(
                        this.vertices[this.vertices.length - 1].x,
                        this.vertices[this.vertices.length - 1].y);
                    for (var i in this.vertices) {
                        var vertex = this.vertices[i];
                        ctx.lineTo(vertex.x, vertex.y);
                    }
                    ctx.resetTransform();
                    ctx.closePath();

                    ctx.fillStyle = this.color;
                    if (this.tmpCollide) ctx.fillStyle = '#ff0000';
                    ctx.fill();
                }
            };
            return Entity;
        })();
    }
    Physics2.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.entities = [];
            var count = 10;
            for (var i = 0; i < count; i++) {
                var width = randRealRange(30, 80);
                var height = randRealRange(80, 200);
                var mass = randRealRange(10, 30);
                var entity = new this.Entity(
                    new Vector2f(
                        randRealRange(width, gameEngine.width - width),
                        randRealRange(height, gameEngine.height - height)),
                    new Vector2f(
                        randRealRange(-0.1, 0.1),
                        randRealRange(-0.1, 0.1)),
                    0, randRealRange(-Math.PI * 2 / 1000, Math.PI * 2 / 2000),
                    mass,
                    randConvex(width, height),
                    randColor()
                );
                this.entities.push(entity);
            }
        },
        update(gameEngine, deltaTime) {
            for (var i in this.entities) {
                this.entities[i].update(gameEngine, deltaTime);
            }

            for (var i = 0; i < this.entities.length; i++) {
                var entity = this.entities[i];
                var pos = entity.position;
                var vel = entity.velocity;

                for (var j in entity.vertices) {
                    var vertex = entity.vertices[j].rotate(entity.angle).add(pos);

                    if (vertex.x < 0) {
                        pos.x += -vertex.x;
                        vel.x *= -1;
                    }
                    if (vertex.y < 0) {
                        pos.y += -vertex.y;
                        vel.y *= -1;
                    }
                    if (vertex.x >= gameEngine.width) {
                        pos.x += -(vertex.x - gameEngine.width);
                        vel.x *= -1;
                    }
                    if (vertex.y >= gameEngine.height) {
                        pos.y += -(vertex.y - gameEngine.height);
                        vel.y *= -1;
                    }
                }
            }

            for (var i in this.entities) {
                this.entities[i].tmpCollide = undefined;
            }
            for (var i = 0; i < this.entities.length; i++) {
                var A = this.entities[i];
                for (var j = i + 1; j < this.entities.length; j++) {
                    var B = this.entities[j];

                    var { result, simplex } = geometry.gjkTestConvex(
                        A.vertices, B.vertices,
                        A.position, B.position,
                        A.angle, B.angle);

                    if (result) {
                        // XXX
                        A.tmpCollide = B;
                        B.tmpCollide = A;

                        // Get detailed collision information
                        var { mtv, collisionPoint } = geometry.epa(
                            A.vertices, B.vertices, simplex,
                            A.position, B.position,
                            A.angle, B.angle);

                        // Apply physics reaction
                        var normal = mtv.norm();

                        var r1 = collisionPoint.a.sub(A.position);
                        var r2 = collisionPoint.b.sub(B.position);
                        
                        var relVelocity = A.velocity.sub(B.velocity)
                            .add(r1.rotateLeft().mul(A.angularVelocity))
                            .sub(r2.rotateLeft().mul(B.angularVelocity));
                        
                        var e = 1.0; // coefficient of restitution
                        var impulse = (1 + e) * relVelocity.dot(normal) / 
                            (1 / A.mass + 1 / B.mass +
                                Math.pow(r1.rotateLeft().dot(normal), 2) / A.inertia + 
                                Math.pow(r2.rotateLeft().dot(normal), 2) / B.inertia
                            );

                        var deltaVel1 = normal.mul(-impulse / A.mass);
                        var deltaVel2 = normal.mul(impulse / B.mass);
                        A.velocity = A.velocity.add(deltaVel1);
                        B.velocity = B.velocity.add(deltaVel2);

                        var deltaW1 = -impulse / A.inertia * (r1.cross(normal));
                        var deltaW2 = impulse / B.inertia * (r2.cross(normal));
                        A.angularVelocity += deltaW1;
                        B.angularVelocity += deltaW2;

                        // Solve collision
                        A.position = A.position.sub(mtv.div(2));
                        B.position = B.position.add(mtv.div(2));
                    }
                }
            }

            // Calculate total kinetic energy
            this.totalEnergy = 0;
            for (var i = 0; i < this.entities.length; i++) {
                var entity = this.entities[i];
                var energy = 1 / 2 * entity.mass * Math.pow(entity.velocity.length(), 2);
                energy += 1 / 2 * entity.inertia * Math.pow(entity.angularVelocity, 2);

                this.totalEnergy += energy;
            }
        },
        draw(gameEngine, ctx) {
            for (var i in this.entities) {
                this.entities[i].draw(gameEngine, ctx);
            }

            if (this.totalEnergy) {
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#000000';
                ctx.fillText(this.totalEnergy.toFixed(3), 10, 10);
            }
        },
        onKeyDown(e) { },
        onKeyUp(e) { },
        onMouseDown(e) { },
        onMouseUp(e) { },
        onMouseMove(e) { }
    });
    Physics2.prototype.constructor = Physics2;

    function ConvexHall() {

    }
    ConvexHall.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.vertices = [];
            this.outline = [];
        },
        update(gameEngine, deltaTime) {

        },
        draw(gameEngine, ctx) {
            if (this.outline.length > 0) {
                ctx.beginPath();
                var last = this.outline[this.outline.length - 1];
                ctx.moveTo(last.x, last.y);
                for (var i in this.outline) {
                    var vertex = this.outline[i];
                    ctx.lineTo(vertex.x, vertex.y);
                }
                ctx.closePath();

                ctx.strokeStyle = '#ff0000';
                ctx.stroke();
            }

            for (var i in this.vertices) {
                var vertex = this.vertices[i];

                ctx.beginPath();
                ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                ctx.lineTo(vertex.x, vertex.y);
                ctx.strokeStyle = '#00ff00';
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, 5, 0, Math.PI * 2, false);

                ctx.fillStyle = '#000000';
                if (i == 0) ctx.fillStyle = '#00ff00';
                if (i == 1) ctx.fillStyle = '#0000ff';
                ctx.fill();

                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#ff0000';
                ctx.fillText(i, vertex.x, vertex.y);
            }
        },
        onKeyDown(e) { },
        onKeyUp(e) { },
        onMouseDown({ offsetX: x, offsetY: y }) {
            this.addVertex(x, y);
            this.doConvexHall();
        },
        onMouseUp(e) { },
        onMouseMove(e) { },
        addVertex(x, y) {
            this.vertices.push(new Vector2f(x, y));

            this.outline.push(new Vector2f(x, y));
        },
        doConvexHall() {
            this.outline = [];
            if (this.vertices.length < 2) return;

            var minVertex = this.vertices[0];
            for (var i in this.vertices) {
                var vertex = this.vertices[i];

                if (vertex.y < minVertex.y)
                    minVertex = vertex;
                else if (vertex.y == minVertex.y && vertex.x < minVertex.x)
                    minVertex = vertex;
            }

            this.vertices.sort((a, b) => {
                if (a == minVertex) return -1;
                if (b == minVertex) return 1;
                if (a == minVertex && b == minVertex) return 0;

                return (b.sub(minVertex)).cross((a.sub(minVertex)));
            });

            var stack = [this.vertices[0], this.vertices[1]];
            for (var i = 2; i < this.vertices.length; i++) {
                var cur = this.vertices[i];

                while (stack.length > 1) {
                    var a = stack[stack.length - 2];
                    var b = stack[stack.length - 1];
                    var c = cur;

                    var cross = (b.sub(a)).cross((c.sub(b)));

                    if (cross > 0 ||
                        (cross == 0 && (b.sub(a)).length() > (c.sub(a)).length())) {
                        break;
                    }
                    stack.pop();
                }
                stack.push(cur);
            }
            this.outline = stack;
        }
    });
    ConvexHall.prototype.constructor = ConvexHall;

    function Mesh(vertices) {
        this.vertices = vertices;
    }
    Mesh.prototype = {
        /*
         * Get closest point using GJK algorithm.
         * @param {Vector2f} q - Query Point
         */
        getClosestPoint(q) {
            if (this.vertices.length == 0)
                return null;

            var simplex = [this.vertices[0]];

            while (false) { // XXX until when?
                // Get closest point p on simplex.
                var p;
                if (this.simplex.length == 1) {
                    p = simplex0();
                } else if (this.simplex.length == 2) {
                    p = simplex1();
                } else if (this.simplex.length == 3) {
                    p = simplex2();
                }

                // Cull non-contributing vertices from S.

                // Build vector d pointing from p to q.

                // Compute support point in direction d.

                // Add support point to simplex.
            }
        },
        simplex0(q) {
            return this.vertices[0];
        },
        simplex1(q) {
            var a = this.vertices[0];
            var b = this.vertices[1];

            var dir = b.sub(a);
            var len = dir.length();

            var offset = q.sub(a).dot(dir) / len;

            if (0 <= offset && offset < len) {
                return dir.mul(offset / len).add(a);
            } else {
                if (offset < 0) return a;
                else return b;
            }
        },
        simplex2(q) {
            return null;
        }
    };

    function Simplex1() {

    }
    Simplex1.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.mouse = new Vector2f(0, 0);

            var center = new Vector2f(gameEngine.width / 2, gameEngine.height / 2);
            var angle = Math.PI / 3;
            this.vertices = [
                new Vector2f(0, 100).rotate(angle).add(center),
                new Vector2f(0, -100).rotate(angle).add(center)
            ];
            this.mesh = new Path2D();
            var last = this.vertices[this.vertices.length - 1];
            this.mesh.moveTo(last.x, last.y);
            for (var i in this.vertices) {
                var cur = this.vertices[i];
                this.mesh.lineTo(cur.x, cur.y);
            }
        },
        update(gameEngine, deltaTime) { },
        draw(gameEngine, ctx) {
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.strokeStyle = '#ff0000';
            ctx.stroke(this.mesh);

            var p = this.getClosestPoint();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            ctx.strokeStyle = '#ff00ff';
            ctx.stroke();
        },
        onMouseMove(e) {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
        },
        getClosestPoint() {
            var dir = this.vertices[1].sub(this.vertices[0]).norm();
            var offset = this.mouse.sub(this.vertices[0]).dot(dir);
            var max = this.vertices[1].sub(this.vertices[0]).length();

            if (0 <= offset && offset < max) {
                return dir.mul(offset).add(this.vertices[0]);
            } else {
                if (offset < 0) {
                    return this.vertices[0];
                } else {
                    return this.vertices[1];
                }
            }
        }
    });
    Simplex1.prototype.constructor = Simplex1;

    function Simplex2() {

    }
    Simplex2.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.mouse = new Vector2f(0, 0);

            var center = new Vector2f(gameEngine.width / 2, gameEngine.height / 2);
            // this.a = new Vector2f(
            //     randIntRange(-200, 200),
            //     randIntRange(-200, 200)
            // ).add(center);
            // this.b = new Vector2f(
            //     randIntRange(-200, 200),
            //     randIntRange(-200, 200)
            // ).add(center);
            // this.c = new Vector2f(
            //     randIntRange(-200, 200),
            //     randIntRange(-200, 200)
            // ).add(center);
            this.a = new Vector2f(-100, -100).add(center);
            this.b = new Vector2f(-100, 100).add(center);
            this.c = new Vector2f(100, 100).add(center);

            this.mesh = new Path2D();
            this.mesh.moveTo(this.a.x, this.a.y);
            this.mesh.lineTo(this.b.x, this.b.y);
            this.mesh.lineTo(this.c.x, this.c.y);
            this.mesh.lineTo(this.a.x, this.a.y);
        },
        draw(gameEngine, ctx) {
            ctx.translate(-0.5, -0.5);
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.strokeStyle = '#ff0000';
            ctx.stroke(this.mesh);

            this.mouse.x = Math.floor(this.mouse.x);
            this.mouse.y = Math.floor(this.mouse.y);

            var p = geometry.getClosestPoint2(this.a, this.b, this.c, this.mouse);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            ctx.strokeStyle = '#ff00ff';
            ctx.stroke();
            ctx.resetTransform();
        },
        onMouseMove(e) {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
        }
    });
    Simplex2.prototype.constructor = Simplex2;

    function Simplex3() {
    }
    Simplex3.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.mouse = new Vector2f(0, 0);

            var center = new Vector2f(gameEngine.width / 2, gameEngine.height / 2);
            var vertices = [];
            for (var i = 0; i < 20; i++) {
                vertices.push(new Vector2f(
                    randRealRange(-200, 200),
                    randRealRange(-200, 200)
                ).add(center));
            }
            vertices = geometry.convexHull(vertices);
            this.vertices = vertices;

            this.mesh = new Path2D();
            var last = vertices[vertices.length - 1];
            this.mesh.moveTo(last.x, last.y);
            for (var i in vertices) {
                this.mesh.lineTo(vertices[i].x, vertices[i].y);
            }

            this.p = new Vector2f(0, 0);
        },
        update(gameEngine, deltaTime) {
        },
        draw(gameEngine, ctx) {
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.strokeStyle = '#ff0000';
            ctx.stroke(this.mesh);

            ctx.beginPath();
            ctx.arc(this.p.x, this.p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.p.x, this.p.y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            ctx.strokeStyle = '#ff00ff';
            ctx.stroke();
        },
        onMouseMove(e) {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;

            this.p = geometry.getClosestPointConvex(this.vertices, this.mouse);
        }
    });
    Simplex3.prototype.constructor = Simplex3;

    function Minkowski() {
        this.Polygon = (function () {
            function Polygon(position, vertices, color) {
                this.position = position;
                this.vertices = vertices;
                this.color = color;

                this.mesh = new Path2D();
                var last = this.vertices[this.vertices.length - 1];
                this.mesh.moveTo(last.x, last.y);
                for (var i in this.vertices) {
                    this.mesh.lineTo(this.vertices[i].x, this.vertices[i].y);
                }
            }
            Polygon.prototype = {
                draw(gameEngine, ctx) {
                    ctx.translate(-0.5, -0.5);
                    ctx.translate(this.position.x, this.position.y);
                    ctx.strokeStyle = '#000000';
                    ctx.stroke(this.mesh);

                    if (this.mouseOver) {
                        ctx.fillStyle = '#ff0000aa';
                        ctx.fill(this.mesh);
                    }

                    if (this.simplex) {
                        if (this.simplex.length == 3) {
                            ctx.beginPath();
                            var last = this.simplex[this.simplex.length - 1].sub(this.position);
                            ctx.moveTo(last.x, last.y);
                            for (var i in this.simplex) {
                                ctx.lineTo(
                                    this.simplex[i].x - this.position.x,
                                    this.simplex[i].y - this.position.y
                                );
                            }

                            ctx.fillStyle = '#00ff00aa';
                            ctx.fill();
                        } else if (this.simplex.length == 2) {
                            ctx.beginPath();
                            ctx.moveTo(
                                this.simplex[0].x - this.position.x,
                                this.simplex[0].y - this.position.y
                            );
                            ctx.lineTo(
                                this.simplex[1].x - this.position.x,
                                this.simplex[1].y - this.position.y
                            );

                            ctx.strokeStyle = '#000000';
                            ctx.stroke();
                        }

                        for (var i in this.simplex) {
                            ctx.beginPath();
                            ctx.arc(
                                this.simplex[i].x - this.position.x,
                                this.simplex[i].y - this.position.y,
                                5,
                                0,
                                Math.PI * 2);
                            ctx.fillStyle = '#00ffffaa';
                            ctx.fill();
                        }
                    }

                    if (this.p) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.fillStyle = '#000000';
                        ctx.fillText('p',
                            this.p.x - this.position.x,
                            this.p.y - this.position.y);

                        if (this.d) {
                            ctx.beginPath();
                            ctx.moveTo(
                                this.p.x - this.position.x,
                                this.p.y - this.position.y
                            );
                            ctx.lineTo(
                                this.p.x - this.position.x + this.d.x,
                                this.p.y - this.position.y + this.d.y
                            );
                            ctx.strokeStyle = '#ff00ffaa';
                            ctx.stroke();
                        }
                    }

                    if (this.support) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.fillStyle = '#000000';
                        ctx.fillText('support',
                            this.support.x - this.position.x,
                            this.support.y - this.position.y);
                    }

                    if (this.msg) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.fillStyle = '#000000';
                        ctx.fillText(this.msg, 0, 0);
                    }

                    if (this.tmpCollide) {
                        ctx.fillStyle = '#ff0000aa';
                        ctx.fill(this.mesh);
                    }

                    if (this.mtv) {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(this.mtv.x, this.mtv.y);
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.lineWidth = 1;

                        ctx.fillStyle = '#000000';
                        ctx.fillText('' + this.mtv.length().toFixed(2), 0, 10);
                    }

                    ctx.resetTransform();
                }
            };

            return Polygon;
        })();
    }
    Minkowski.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.A = new this.Polygon(
                new Vector2f(150, 150),
                randConvex(100, 100, 10),
                randColor()
            );
            this.B = new this.Polygon(
                new Vector2f(400, 300),
                randConvex(100, 100, 10),
                randColor()
            );
            this.C = new this.Polygon(
                new Vector2f(680, 120),
                [
                    new Vector2f(-100, -100),
                    new Vector2f(100, -100),
                    new Vector2f(100, 100),
                    new Vector2f(-100, 100)
                ],
                randColor()
            );

            this.polygons = [this.A, this.B, this.C];

            this.mouse = new Vector2f();
            this.prevMouse = null;
        },
        update(gameEngine, deltatTime) {
        },
        draw(gameEngine, ctx) {
            this.A.draw(gameEngine, ctx);
            this.B.draw(gameEngine, ctx);
            this.C.draw(gameEngine, ctx);
        },
        onMouseDown(e) {
            this.mouseDown = true;
        },
        onMouseUp(e) {
            this.mouseDown = false;
            this.curPolygon = null;
        },
        onMouseMove(e) {
            this.prevMouse = this.prevMouse ?
                this.mouse.copy() : new Vector2f(e.offsetX, e.offsetY);
            this.mouse.set(e.offsetX, e.offsetY);
            this.mouseDelta = this.mouse.sub(this.prevMouse);

            if (this.curPolygon && this.mouseDown) {
                this.curPolygon.position = this.curPolygon.position.add(this.mouseDelta);
            }

            for (var i in this.polygons) {
                var polygon = this.polygons[i];

                var vertices = [];
                for (var i in polygon.vertices)
                    vertices.push(polygon.vertices[i].add(polygon.position));

                var { result, simplex, msg, d, p, support } = geometry.gjkTest(vertices, this.mouse);
                polygon.mouseOver = result;
                polygon.simplex = simplex;
                polygon.msg = msg;
                polygon.d = d;
                polygon.p = p;
                polygon.support = support;

                if (!this.curPolygon && result && this.mouseDown) {
                    this.curPolygon = polygon;
                }
            }

            for (var i in this.polygons) {
                this.polygons[i].tmpCollide = null;
                this.polygons[i].mtv = null;
                this.polygons[i].polytope = null;
            }
            for (var i = 0; i < this.polygons.length; i++) {
                var M = this.polygons[i];
                for (var j = i + 1; j < this.polygons.length; j++) {
                    var N = this.polygons[j];

                    var verticesM = [];
                    var verticesN = [];

                    for (var v in M.vertices) {
                        verticesM.push(M.vertices[v].add(M.position));
                    }
                    for (var v in N.vertices) {
                        verticesN.push(N.vertices[v].add(N.position));
                    }

                    var { result, simplex, msg } = geometry.gjkTestConvex(verticesM, verticesN);

                    if (result) {
                        M.tmpCollide = N;
                        N.tmpCollide = M;

                        var { mtv, msg, polytope, distance } = geometry.epa(
                            verticesM, verticesN, simplex.slice(0));

                        M.mtv = mtv.negative();
                        N.mtv = mtv;

                        if (msg != '') {
                            console.log(msg);
                        }
                    }
                }
            }
        }
    });
    Minkowski.prototype.constructor = Minkowski;

    function ClosestEdge() {}
    ClosestEdge.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.vertices = [];

            var center = new Vector2f(gameEngine.width / 2, gameEngine.height / 2);
            var size = 250;
            for (var i = 0; i < 10; i++) {
                this.vertices.push(new Vector2f(
                    randIntRange(-size, size),
                    randIntRange(-size, size)
                ).add(center));
            }
            this.vertices = geometry.convexHull(this.vertices);

            this.mesh = new Path2D();
            var last = this.vertices[this.vertices.length - 1];
            this.mesh.moveTo(last.x, last.y);
            for (var i in this.vertices) {
                this.mesh.lineTo(this.vertices[i].x, this.vertices[i].y);
            }

            this.mouse = new Vector2f();
        },
        update(gameEngine, deltaTime) {

        },
        draw(gameEngine, ctx) {
            ctx.strokeStyle = '#000000';
            ctx.stroke(this.mesh);

            if (this.result) {
                ctx.beginPath();
                var vertexTail = this.vertices[this.result.tail];
                var vertexHead = this.vertices[this.result.head];
                ctx.moveTo(vertexTail.x, vertexTail.y);
                ctx.lineTo(vertexHead.x, vertexHead.y);
                ctx.strokeStyle = '#ff0000';
                ctx.stroke();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.mouse.x, this.mouse.y);
                ctx.lineTo(this.mouse.x - this.result.perp.x, this.mouse.y - this.result.perp.y);
                ctx.strokeStyle = '#ff00ff';
                ctx.stroke();

                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.fillText(this.result.distance.toFixed(2), this.mouse.x, this.mouse.y);
                ctx.fillText('(' + this.result.perp.x.toFixed(2) + ', ' + this.result.perp.y.toFixed(2) + ')',
                    this.mouse.x, this.mouse.y - 12);

                ctx.fillText('tail', vertexTail.x, vertexTail.y);
                ctx.fillText('head', vertexHead.x, vertexHead.y);
            }
        },
        onMouseMove(e) {
            this.mouse.set(e.offsetX, e.offsetY);

            this.result = geometry.findClosestEdge(this.vertices.map(o => new SimplexVertex(o)), this.mouse);
            this.result.perp = this.result.perp.norm().mul(this.result.distance);
        }
    });
    ClosestEdge.prototype.constructor = ClosestEdge;

    function MinkowskiVisual() {
        this.Polygon = (function() {
            function Polygon(vertices, position) {
                this.vertices = vertices;
                this.position = position;

                this.path = new Path2D();
                var last = this.vertices[this.vertices.length - 1];
                this.path.moveTo(last.x, last.y);
                for (var i = 0; i < this.vertices.length; i++) {
                    this.path.lineTo(this.vertices[i].x, this.vertices[i].y);
                }
            }
            Polygon.prototype = {
                update(gameEngine, deltaTime) {},
                draw(gameEngine, ctx) {
                    ctx.translate(this.position.x, this.position.y);

                    if (this.mouseOver) {
                        ctx.fillStyle = '#ff0000aa';
                        ctx.fill(this.path);
                    }

                    ctx.strokeStyle = '#000000';
                    ctx.stroke(this.path);

                    ctx.resetTransform();
                }
            };

            return Polygon;
        })();
    }
    MinkowskiVisual.prototype = Object.assign(new BaseGame(), {
        init(gameEngine) {
            this.A = new this.Polygon(
                randConvex(),
                new Vector2f(
                    200, gameEngine.height / 2
                )
            );
            this.B = new this.Polygon(
                randConvex(),
                new Vector2f(
                    gameEngine.width - 200, gameEngine.height / 2
                )
            );
            this.polygons = [this.A, this.B];
            this.center = new Vector2f(gameEngine.width / 2, gameEngine.height / 2);
        },
        update(gameEngine, deltaTime) {
            for (var i in this.polygons) {
                this.polygons[i].update(gameEngine, deltaTime);
            }

            if (!this.mouseDown) {
                this.curPolygon = null;
            }

            for (var i in this.polygons) {
                var polygon = this.polygons[i];

                var { result } = geometry.gjkTest(polygon.vertices, this.mouse || Vector2f.ZERO, polygon.position, 0);
                polygon.mouseOver = result;

                if (result && this.mouseDown && !this.curPolygon) {
                    this.curPolygon = polygon;
                }
            }

            if (this.curPolygon) {
                this.curPolygon.position = this.curPolygon.position.add(this.deltaMouse || Vector2f.ZERO);
            }

            this.verticesSum = [];
            for (var i in this.A.vertices) {
                for (var j in this.B.vertices) {
                    var vertex = this.A.vertices[i].add(this.A.position)
                        .sub(this.B.vertices[j].add(this.B.position));
                    this.verticesSum.push({ vertex, i, j });
                }
            }
            this.verticesSumConvex = geometry.convexHull(this.verticesSum.map(o => o.vertex));

            this.curVertex = null;
            for (var a in this.verticesSum) {
                var { vertex, i, j } = this.verticesSum[a];
                var newVertex = vertex.add(this.center);
                if (newVertex.sub(this.mouse || Vector2f.ZERO).length() <= 3) {
                    this.curVertex = this.verticesSum[a];
                }
            }

            var { result: collide, simplex } = geometry.gjkTestConvex(
                this.A.vertices, this.B.vertices,
                this.A.position, this.B.position);
            this.collide = collide;
            if (collide) {
                this.simplex = simplex;

                var { mtv, collisionPoint } = geometry.epa(this.A.vertices, this.B.vertices,
                    simplex.slice(0), this.A.position, this.B.position);

                this.mtv = mtv;
                this.collisionPoint = collisionPoint;
            }

            this.deltaMouse = Vector2f.ZERO;
        },
        draw(gameEngine, ctx) {
            // Draw axis
            ctx.beginPath();
            ctx.moveTo(0, gameEngine.height / 2);
            ctx.lineTo(gameEngine.width, gameEngine.height / 2);
            ctx.moveTo(gameEngine.width / 2, 0);
            ctx.lineTo(gameEngine.width / 2, gameEngine.height);
            ctx.strokeStyle = '#aaaaaa';
            ctx.stroke();

            // Draw polygons
            for (var i in this.polygons) {
                this.polygons[i].draw(gameEngine, ctx);
            }

            // Draw minkowski difference
            for (var i in this.verticesSum) {
                var vertex = this.verticesSum[i].vertex.add(this.center);

                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, 3, 0, Math.PI * 2, false);
                ctx.fillStyle = '#00ff00aa';
                ctx.fill();
            }

            if (this.collide) {
                for (var i in this.simplex) {
                    var vertex = this.simplex[i].getVertex().add(this.center);

                    ctx.beginPath();
                    ctx.arc(vertex.x, vertex.y, 3, 0, Math.PI * 2, false);
                    ctx.fillStyle = '#ff0000aa';
                    ctx.fill();
                }

                ctx.moveTo(this.center.x, this.center.y);
                ctx.lineTo(this.center.x + this.mtv.x, this.center.y + this.mtv.y);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#000000';
                ctx.stroke();
                ctx.lineWidth = 1;

                ctx.beginPath();
                var cpA = this.collisionPoint.a;
                var cpB = this.collisionPoint.b;
                ctx.arc(cpA.x, cpA.y, 10, 0, Math.PI * 2, false);
                ctx.arc(cpB.x, cpB.y, 10, 0, Math.PI * 2, false);
                ctx.fillStyle = '#ffff00aa';
                ctx.fill();
            }

            // Draw minkowski difference convex hull
            ctx.beginPath();
            var last = this.verticesSumConvex[this.verticesSumConvex.length - 1].add(this.center);
            ctx.moveTo(last.x, last.y);
            for (var i in this.verticesSumConvex) {
                var vertex = this.verticesSumConvex[i].add(this.center);
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            // Highlight point on mouse
            if (this.curVertex) {
                var { vertex, i, j } = this.curVertex;
                var newVertex = vertex.add(this.center);

                ctx.beginPath();
                ctx.arc(newVertex.x, newVertex.y, 3, 0, Math.PI * 2, false);
                ctx.fillStyle = '#ff0000';
                ctx.fill();

                ctx.beginPath();
                var a = this.A.vertices[i].add(this.A.position);
                ctx.arc(a.x, a.y, 3, 0, Math.PI * 2, false);
                ctx.fillStyle = '#ff0000';
                ctx.fill();

                ctx.beginPath();
                var b = this.B.vertices[j].add(this.B.position);
                ctx.arc(b.x, b.y, 3, 0, Math.PI * 2, false);
                ctx.fillStyle = '#ff0000';
                ctx.fill();
            }
        },
        onMouseMove(e) {
            var curMouse = new Vector2f(e.offsetX, e.offsetY);
            var prevMouse = this.mouse || curMouse;
            var deltaMouse = curMouse.sub(prevMouse);

            this.deltaMouse = (this.deltaMouse || Vector2f.ZERO).add(deltaMouse);

            this.mouse = curMouse;
        },
        onMouseDown(e) {
            this.mouseDown = true;
        },
        onMouseUp(e) {
            this.mouseDown = false;
        }
    });
    MinkowskiVisual.prototype.constructor = MinkowskiVisual;

    window.onload = function () {
        window.physics1 = new GameEngine('#physics-1', 'game-canvas',
            800, 500, new PhysicsGame());
        window.physics2 = new GameEngine('#physics-2', 'game-canvas',
            800, 500, new Physics2());
        window.convexHall = new GameEngine('#convex-hall', 'game-canvas',
            800, 500, new ConvexHall());
        window.simplex1 = new GameEngine('#simplex-1', 'game-canvas',
            800, 500, new Simplex1());
        window.simplex2 = new GameEngine('#simplex-2', 'game-canvas',
            800, 500, new Simplex2());
        window.simplex3 = new GameEngine('#simplex-3', 'game-canvas',
            800, 500, new Simplex3());
        window.minkowski = new GameEngine('#minkowski', 'game-canvas',
            800, 500, new Minkowski());
        window.closestEdge = new GameEngine('#closest-edge', 'game-canvas',
            800, 500, new ClosestEdge());
        window.minkowskiVisual = new GameEngine('#minkowski-visualize', 'game-canvas',
            800, 500, new MinkowskiVisual());
    };
})();