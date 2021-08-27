import { Request, Response } from 'express';
import axios from 'axios';
import { token } from 'morgan';
import * as jwt from 'jsonwebtoken';
import jws from 'jws';
import base64Url from 'base64url';

declare module 'express-session' {
  interface SessionData {
    views: number;
    userId: string;
    instanceId: string;
  }
}

async function verifyToken(token: string) {
  let base64UrlToken = base64Url.fromBase64(token);
  const decoded = jwt.decode(base64UrlToken, { complete: true });
  if (!decoded) {
    return;
  }
  const { kid } = decoded.header;

  const uri = `https://public-keys.auth.elb.ap-northeast-1.amazonaws.com/${kid}`;

  const response = await await axios.get(uri);
  const key = response.data;

  try {
    const verify = jws.verify(token, 'ES256', key);
    if (!verify) {
      return null;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }

  return decoded.payload;
}

// Display detail page for a specific User.
export async function user_controller(req: Request, res: Response) {
  const instanceId = (
    await axios.get('http://169.254.169.254/latest/meta-data/instance-id')
  ).data;
  const encodedJwt = req.header('x-amzn-oidc-data');
  if (!encodedJwt) {
    res.send('encodedJwt is undefined').status(200);
    return;
  }

  const payload = await verifyToken(encodedJwt);
  if (!payload) {
    return;
  }
  const userId = payload.username;

  const session = req.session;
  if (!!session.views && session.userId === userId) {
    // セッションあり、ユーザー名が正しければ回数を増やす
    session.views++;
  } else if (!session.views) {
    // セッションなし -> セッション回数入力、ユーザー名を追加
    session.views = 1;
    session.userId = userId;
  } else {
    // セッション破棄
    session.destroy;
  }
  res.render('index', {
    userId: session.userId,
    views: session.views,
    instanceId: instanceId,
  });
}
