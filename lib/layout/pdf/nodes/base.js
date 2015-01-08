'use strict'

var BaseNode = module.exports = function() {
  this.type = 'BaseNode'
  this.allowBreak = false
  this.page = 0
  this.computed = false
  this.arranged = false
}

BaseNode.prototype.mustUpdate = function(/* cursor */) {
  return false
}

BaseNode.prototype.beforeContent = function(cursor) {
  return cursor
}

BaseNode.prototype.afterContent = function(cursor) {
  return cursor
}

BaseNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  this.width  = 0
  this.height = 0
}

BaseNode.prototype.compute = function(cursor) {
  var must = this.mustUpdate(cursor) || !this.computed || cursor.force

  if (!must) {
    cursor.setPage(this.page)
  } else {
    this._compute(cursor)
    this.computed = true
    this.arranged = false
    cursor.force = true

    this.page = cursor.currentPage
  }

  cursor = this.beforeContent(cursor)

  if ('children' in this) {
    this.children.forEach(function(child) {
      child.compute(cursor)
    })
  }

  this.afterContent(cursor)
}

BaseNode.prototype.arrange = function(cursor) {
  var must = !this.arranged || cursor.force

  cursor.setPage(this.page)

  if (!must) {
    cursor.setPage(this.page)
  } else {
    this.arranged = true
    cursor.force = true

    this.page = cursor.currentPage
  }

  cursor = this.beforeContent(cursor)

  if ('children' in this) {

    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i]

      if (child.type === 'PageBreakNode') {
        if (cursor.pageBreak(child) === null) {
          console.log('INVALIDATE', child.id)
          this.children.splice(i, 1)
          --i
        } else {
          console.log('VALID')
        }

        continue
      }

      if (cursor.mustBreak(child)) {
        console.log('BREAK', child.type, child.y, cursor.offset, child.height)
        child.arranged = false

        // page break
        this.children.splice(i, 0, cursor.pageBreak())

        return false
      }

      if (!child.arrange(cursor)) {
        return false
      }
    }
  }

  this.afterContent(cursor)

  return true
}