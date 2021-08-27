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

// Display detail page for a specific User.
export async function user_controller(req: Request, res: Response) {
  const instanceId = (
    await axios.get('http://169.254.169.254/latest/meta-data/instance-id')
  ).data;
  // const instanceId = 'dummy-instanceId';
  const encodedJwt = req.header('x-amzn-oidc-data');
  if (!encodedJwt) {
    res.send('encodedJwt is undefined').status(200);
    return;
  }
  let base64UrlToken = base64Url.fromBase64(encodedJwt);
  const decoded = jwt.decode(base64UrlToken, { complete: true });
  if (!decoded) {
    return;
  }
  const { kid } = decoded.header;

  const uri = `https://public-keys.auth.elb.ap-northeast-1.amazonaws.com/${kid}`;

  const response = await await axios.get(uri);
  const key = response.data;

  try {
    const verify = jws.verify(encodedJwt, 'ES256', key);
    if (!verify) {
      return null;
    }
    //   // var clockTimestamp = Math.floor(Date.now() / 1000);
    //   // if (clockTimestamp >= decoded.header.exp) {
    //   //   // Token expired.
    //   //   return null;
    //   // }
  } catch (err) {
    console.error(err);
    throw err;
  }

  const userId = decoded.payload.username;

  // NG
  // const jwtHeaders = encodedJwt.split('.')[0];
  // if (!jwtHeaders) {
  //   res.send('jwtHeaders is undefined').status(200);
  //   return;
  // }
  // const decodedJwtHeaders = Buffer.from(jwtHeaders, 'base64').toString('utf8');
  // const decodedJson = JSON.parse(decodedJwtHeaders) as TokenHeader;
  // // const kid = decodedJson.kid;

  // const uri =
  //   'https://public-keys.auth.elb.ap-northeast-1.amazonaws.com/' + kid;
  // const response = await axios.get(uri);
  // const key = response.data;
  // const payload = jwt.verify(
  //   encodedJwt,
  //   key,
  //   { algorithms: ['ES256'] },
  //   function (err, decodedToken) {
  //     console.log(decodedToken);
  //   }
  // );

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
