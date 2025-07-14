aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_DEFAULT_REGION"
aws cloudfront get-distribution --id  $AWS_CF_DISTRIBUTION_ID > cf-config.json
Etag=$(cat cf-config.json | jq '.ETag' | tr -d \")
aws cloudfront get-distribution-config --id $AWS_CF_DISTRIBUTION_ID --query 'DistributionConfig' --output json > dist-config.json
cat dist-config.json | jq --arg newBuildVersion ${NEW_BUILD_NUMBER} '(.Origins.Items[].CustomHeaders.Items[] | select(.HeaderName == "buildVersion").HeaderValue) |= $newBuildVersion' > dist-config2.json
aws cloudfront update-distribution --id $AWS_CF_DISTRIBUTION_ID --distribution-config "file://dist-config2.json" --if-match "$Etag" > /dev/null
aws cloudfront wait distribution-deployed --id $AWS_CF_DISTRIBUTION_ID
aws cloudfront create-invalidation --distribution-id $AWS_CF_DISTRIBUTION_ID --paths "/*"
rm -f dist-config.json dist-config2.json cf-config.json