class Snake {
  constructor(startX, startY) {
    this.segments = [
      { x: startX - 2, y: startY },
      { x: startX - 1, y: startY },
      { x: startX, y: startY }
    ];
    this.direction = { x: 1, y: 0 };
  }

  get head() {
    return this.segments[this.segments.length - 1];
  }

  setDirection(nextDirection) {
    const isReverse =
      this.segments.length > 1 &&
      this.direction.x === -nextDirection.x &&
      this.direction.y === -nextDirection.y;

    if (!isReverse) {
      this.direction = nextDirection;
    }
  }

  getNextHead() {
    return {
      x: this.head.x + this.direction.x,
      y: this.head.y + this.direction.y
    };
  }

  move(shouldGrow) {
    const nextHead = this.getNextHead();
    this.segments.push(nextHead);

    if (shouldGrow) {
      return nextHead;
    }

    this.segments.shift();
    return nextHead;
  }

  occupiesCell(x, y) {
    return this.segments.some((segment) => segment.x === x && segment.y === y);
  }

  hitsWall(cols, rows) {
    return this.head.x < 0 || this.head.x >= cols || this.head.y < 0 || this.head.y >= rows;
  }

  hitsSelf() {
    for (let index = 0; index < this.segments.length - 1; index += 1) {
      const segment = this.segments[index];
      if (segment.x === this.head.x && segment.y === this.head.y) {
        return true;
      }
    }

    return false;
  }
}
