// Math object
//
// Author: Jisu Sim
// Date: 2020.05.28
var math = (function() {
    'use strict';

    function Vector2f(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    Vector2f.prototype = {
        add(o) {
            return new Vector2f(this.x + o.x, this.y + o.y);
        },
        sub(o) {
            return new Vector2f(this.x - o.x, this.y - o.y);
        },
        mul(c) {
            return new Vector2f(this.x * c, this.y * c);
        },
        div(c) {
            if (c == 0) return this.copy();
            else return this.mul(1 / c);
        },
        dot(o) {
            return this.x * o.x + this.y * o.y;
        },
        cross(o) {
            return this.x * o.y - this.y * o.x;
        },
        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        norm() {
            return this.div(this.length());
        },
        negative() {
            return this.mul(-1);
        },
        negate() {
            this.x *= -1;
            this.y *= -1;
        },
        rotate(theta) {
            return new Vector2f(
                Math.cos(theta) * this.x - Math.sin(theta) * this.y,
                Math.sin(theta) * this.x + Math.cos(theta) * this.y
            );
        },
        rotateLeft() {
            return new Vector2f(-this.y, this.x);
        },
        rotateRight() {
            return new Vector2f(this.y, -this.x);
        },

        set(x, y) {
            this.x = x;
            this.y = y;
        },
        equals(o) {
            return this.x == o.x && this.y == o.y;
        },
        copy() {
            return new Vector2f(this.x, this.y);
        },
        toVector3f(z = 0) {
            return new Vector3f(this.x, this.y, z);
        }
    };
    Vector2f.ORIGIN = new Vector2f();
    Vector2f.ZERO = new Vector2f();
    Vector2f.X_AXIS = new Vector2f(1, 0);
    Vector2f.Y_AXIS = new Vector2f(0, 1);

    function Vector3f(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector3f.prototype = {
        add(o) {
            return new Vector3f(this.x + o.x, this.y + o.y, this.z + o.z);
        },
        sub(o) {
            return new Vector3f(this.x - o.x, this.y - o.y, this.z - o.z);
        },
        mul(c) {
            return new Vector3f(this.x * c, this.y * c, this.z * c);
        },
        div(c) {
            if (c == 0) return this.copy();
            else return this.mul(1 / c);
        },
        dot(o) {
            return this.x * o.x + this.y * o.y + this.z + o.z;
        },
        cross(o) {
            return new Vector3f(
                this.y * o.z - this.z * o.y,
                this.z * o.x - this.x * o.z,
                this.x * o.y - this.y * o.x
            );
        },
        length() {
            return Math.sqrt(this.dot(this));
        },
        norm() {
            return this.div(this.length());
        },
        rotate(theta) { // XXX Not implemented.
            return new Vector3f(
                0, 0, 0
            );
        },

        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        },
        equals(o) {
            return this.x == o.x && this.y == o.y && this.z == o.z;
        },
        copy() {
            return new Vector3f(this.x, this.y, this.z);
        },
        toVector2f() {
            return new Vector2f(this.x, this.y);
        }
    };

    return {
        Vector2f,
        Vector3f,
    };
})();

var Vector2f = math.Vector2f;
var Vector3f = math.Vector3f;