  
const express = require("express")
const path = require("path")
const uniqid = require("uniqid")
const { getComments, writeComments } = require("../../fsUtilities")
const { check, validationResult } = require("express-validator")

const commentsRouter = express.Router()

const commentsFilePath = path.join(__dirname, "comments.json")

commentsRouter.get("/:id", async (req, res, next) => {
  try {
    const comments = await getComments(commentsFilePath)
    const comment = comments.filter(comment => comment.ID === req.params.id)
    if (comment.length > 0) {
      res.send(comment)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    next(error)
  }
})

commentsRouter.get("/", async (req, res, next) => {
  try {
    const comments = await getComments(commentsFilePath)
    if (req.query && req.query.name) {
      const filteredComments = comments.filter(
        comment =>
          comment.hasOwnProperty("name") &&
          comment.name.toLowerCase() === req.query.name.toLowerCase()
      )
      res.send(filteredComments)
    } else {
      res.send(comments)
    }
  } catch (error) {
    next(error)
  }
})

commentsRouter.post(
  "/",
  [
    check("UserName")
      .isLength({ min: 3 })
      .withMessage("name too short!")
      .exists()
      .withMessage("Insert a name please!"),
  ],
  [
    check("text")
      .isLength({ min: 4 })
      .withMessage("Comment too short!")
      .exists()
      .withMessage("Insert a comment please!"),
  ],
  [
    check("bookAsin")
      .exists()
      .withMessage("Please add the book ID"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        const err = new Error()
        err.message = errors
        err.httpStatusCode = 400
        next(err)
      } else {
        const comments = await getComments(commentsFilePath)
        const newcomment = {
          ...req.body,
          ID: uniqid(),
          createdAt: new Date(),
        }

        comments.push(newcomment)

        await writeComments(commentsFilePath, comments)

        res.status(201).send({ id: newcomment.ID })
      }
    } catch (error) {
        console.log(error)
      next(error)
    }
  }
)

commentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const comments = await getComments(commentsFilePath)
    const newDb = comments.filter(comment => comment.ID !== req.params.id)
    await writeComments(commentsFilePath, newDb)

    res.status(204).send()
  } catch (error) {
      console.log(error)
    next(error)
  }
})

commentsRouter.put("/:id", async (req, res, next) => {
  try {
    const comments = await getComments(commentsFilePath)
    const newDb = comments.filter(comment => comment.ID !== req.params.id)

    const modifiedcomment = {
      ...req.body,
      ID: req.params.id,
      updatedAt: new Date(),
    }

    newDb.push(modifiedcomment)
    await writeComments(commentsFilePath, newDb)

    res.send({ id: modifiedcomment.ID })
  } catch (error) {
    next(error)
  }
})

module.exports = commentsRouter