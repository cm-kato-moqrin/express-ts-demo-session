import { json, Request, Response } from 'express';
import axios from 'axios';
import { token } from 'morgan';
import * as jwt from 'jsonwebtoken';
const jwkToPem = require('jwk-to-pem');

declare module 'express-session' {
  interface SessionData {
    views: number;
    userId: string;
    instanceId: string;
  }
}

interface TokenHeader {
  kid: string;
}

// Display detail page for a specific User.
export async function user_controller(req: Request, res: Response) {
  // const instanceId = (
  //   await axios.get('http://169.254.169.254/latest/meta-data/instance-id')
  // ).data;
  const instanceId = 'dummy-instanceId';
  const encodedJwt = req.header('x-amzn-oidc-data');
  if (!encodedJwt) {
    res.send('encodedJwt is undefined').status(200);
    return;
  }
  const jwtHeaders = encodedJwt.split('.')[0];
  if (!jwtHeaders) {
    res.send('jwtHeaders is undefined').status(200);
    return;
  }
  const decodedJwtHeaders = Buffer.from(jwtHeaders, 'base64').toString('utf8');
  const decodedJson = JSON.parse(decodedJwtHeaders) as TokenHeader;
  const kid = decodedJson.kid;

  const pubReq =
    'https://public-keys.auth.elb.ap-northeast-1.amazonaws.com/' + kid;
  const pem = await axios.get(pubReq);
  const pubKey = pem.data;

  const payload = jwt.verify(
    encodedJwt,
    pubKey,
    { algorithms: ['RS256'] },
    function (err, decodedToken) {
      console.log(decodedToken);
    }
  );
  console.log(payload);
  const userId = 'hogehoge';
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
