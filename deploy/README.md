Minimal deploy helper

Files created in `deploy/`:

- `build_deploy.sh` - copies runtime files into a temp folder and creates a zip ready for EB/S3
- `Procfile` - optional Elastic Beanstalk process file
- `Dockerfile` - simple Dockerfile for ECS/Fargate or local testing
- `.ebextensions/01_env.config` - sample EB env variables (replace values)

Usage

1. Make the script executable:
   chmod +x deploy/build_deploy.sh
2. Run from project root to produce a zip:
   ./deploy/build_deploy.sh
3. Upload the created zip to S3 and create an EB application version, or use `eb deploy` if you use the EB CLI.

Notes

- The script copies `server.js`, `package.json`, `index.html` and `dist/` (if present). Adjust as needed.
- Remove any secrets from files before deploying; set environment variables in AWS (EB console / EB CLI / Secrets Manager).

Commands (quick reference)

Use these commands next time you build & deploy. They assume you have the AWS CLI configured (`aws configure`) and an S3 bucket in the same region as your Elastic Beanstalk environment.

1. Build the zip (from project root):

```bash
chmod +x deploy/build_deploy.sh
./deploy/build_deploy.sh
```

The script will produce a zip in the project root (example: `cma-deploy-202508191626.zip`).

2. Upload the zip to S3 (replace YOUR_BUCKET and region as needed):

```bash
export ZIP_NAME="$(ls -1 *.zip | head -n1)"   # or set to the exact filename
aws s3 cp "./$ZIP_NAME" "s3://YOUR_BUCKET/$ZIP_NAME" --region us-east-2
```

3. Create a new Elastic Beanstalk application version (example using application `trackstock`):

```bash
aws elasticbeanstalk create-application-version \
  --application-name trackstock \
  --version-label "$ZIP_NAME" \
  --source-bundle S3Bucket="YOUR_BUCKET",S3Key="$ZIP_NAME" \
  --region us-east-2
```

4. Update the Elastic Beanstalk environment to the new version (example using environment id `e-7mtd8wujbn`):

```bash
aws elasticbeanstalk update-environment \
  --environment-id e-7mtd8wujbn \
  --version-label "$ZIP_NAME" \
  --region us-east-2
```

Alternative (if you use the EB CLI):

```bash
eb deploy --staged --label "$ZIP_NAME"
```

5. Set environment variables (two options):

- Using EB console: open the environment -> Configuration -> Software -> Edit environment properties and add `PARAGON_SERVER_TOKEN`, `GEMINI_API_KEY`, etc.

- Using AWS CLI (example adds/overwrites two vars):

```bash
aws elasticbeanstalk update-environment \
  --environment-id e-7mtd8wujbn \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=PARAGON_SERVER_TOKEN,Value="YOUR_PARAGON_TOKEN" Namespace=aws:elasticbeanstalk:application:environment,OptionName=GEMINI_API_KEY,Value="YOUR_GEMINI_KEY" \
  --region us-east-2
```

Notes and quick tests

- Make sure the S3 bucket is in the same region as the EB environment (us-east-2 in the examples).
- Do not commit secrets to the repo. Prefer EB environment variables or AWS Secrets Manager.
- After deployment, test the service health and a simple API endpoint:

```bash
curl -I https://your-eb-url/health
curl -s "https://your-eb-url/api/comps?address=123%20Main%20St&city=Anytown" | jq .
```

- If you prefer a single-shot `eb deploy`, configure the EB CLI (`eb init`) and use `eb deploy` from the project root.

Example end-to-end (replace YOUR_BUCKET, keys, and names):

```bash
./deploy/build_deploy.sh
ZIP_NAME="cma-deploy-$(date +%Y%m%d%H%M)" && mv *.zip "$ZIP_NAME".zip
aws s3 cp "$ZIP_NAME".zip s3://YOUR_BUCKET/"$ZIP_NAME".zip --region us-east-2
aws elasticbeanstalk create-application-version --application-name trackstock --version-label "$ZIP_NAME" --source-bundle S3Bucket="YOUR_BUCKET",S3Key="$ZIP_NAME".zip --region us-east-2
aws elasticbeanstalk update-environment --environment-id e-7mtd8wujbn --version-label "$ZIP_NAME" --region us-east-2
```
