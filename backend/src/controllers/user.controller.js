import * as userService from '../services/user.service.js';

export async function getAll(req, res, next) {
  try {
    res.json(await userService.getUsers(req.query.role));
  } catch (err) {
    next(err);
  }
}

export async function getGroomers(req, res, next) {
  try {
    res.json(await userService.getGroomers());
  } catch (err) {
    next(err);
  }
}

export async function changeRole(req, res, next) {
  try {
    res.json(await userService.changeUserRole(Number(req.params.id), req.body.role, req.user));
  } catch (err) {
    next(err);
  }
}
