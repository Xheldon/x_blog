const COS = require('cos-nodejs-sdk-v5');
const tencentcloud = require('tencentcloud-sdk-nodejs');

module.exports = async ({ github, context, core }) => {
    const { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION } =
        process.env;
    // Note: 获取
    var cos = new COS({
        SecretId: COS_SECRET_ID,
        SecretKey: COS_SECRET_KEY,
    });
    // Note: action/github 中的 github.event.commits 对象中并不包含 added modifiy removed 等资源（shit！） https://docs.github.com/cn/actions/learn-github-actions/events-that-trigger-workflows#push
    //  API 发送接口看这个： https://docs.github.com/cn/rest/reference/repos#get-a-commit
    //  所以需要手动发送请求获取 change，因此我用 compare 接口：https://docs.github.com/cn/rest/reference/repos#compare-two-commits
    //  参考了这个人的 aciton： https://github.com/jitterbit/get-changed-files/blob/master/src/main.ts
    //  不过该 API 已经废弃了，要使用这个接口： compareCommitsWithBasehead

    // Note: 如果 commit msg 中含有特定信息则不再继续
    if (context.payload.head_commit.message.startsWith('NO')) {
        console.log('本次任务终止');
        return;
    }
    const base = context.payload.before;
    const head = context.payload.after;

    const response = await github.rest.repos.compareCommitsWithBasehead({
        basehead: `${base}...${head}`,
        owner: context.repo.owner,
        repo: context.repo.repo,
    });
    if (response.status !== 200) {
        core.setFailed(
            `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
                "Please submit an issue on this action's GitHub repo."
        );
    }
    if (response.data.status !== 'ahead') {
        core.setFailed(`head commit 的 id 落后于 base commit，搞错了吧？`);
    }
    const files = response.data.files;
    // Note: 从 push 事件中获取到相关文件变动信息，然后进行相应的上传和删除
    const addAndModifyList = [];
    const removedList = [];
    const renamedList = [];
    for (const file of files) {
        const filename = file.filename;
        switch (file.status) {
            case 'added':
            case 'modified':
                addAndModifyList.push(filename);
                break;
            case 'removed':
                removedList.push(filename);
                break;
            case 'renamed':
                // Note: 重命名的，需要删了旧的，上传新的
                addAndModifyList.push(filename);
                removedList.push(file.previous_filename);
                renamedList.push({
                    before: file.previous_filename,
                    after: filename
                });
            default:
                console.log(`特殊文件状态:${file.status}:`, file);
                break;
        }
    }
    if (addAndModifyList.length) {
        console.log('添加或修改的文件列表:', addAndModifyList);
    }
    if (removedList.length) {
        console.log('移除的文件列表:', removedList);
    }
    if (renamedList.length) {
        console.log('重命名的文件有:', renamedList);
    }
console.log('--------------------------------------------');
    const ignored = [];
    const addFiles = [];
    const removedFiles = [];
    for (let fileName of addAndModifyList) {
        addFiles.push({
            Bucket: COS_BUCKET,
            Region: COS_REGION,
            Key: fileName,
            FilePath: fileName
        });
    }

    for (let fileName of removedList) {
        console.log('即将删除文件:', fileName);
        removedFiles.push({
            Key: fileName,
        });
    }

    // Note: 执行上传
    if (addAndModifyList.length) {
        cos.uploadFiles(
            {
                files: addFiles,
                SliceSize: 1024 * 1024 * 10 /* 设置大于10MB采用分块上传 */,
                onProgress: function (info) {
                    var percent = parseInt(info.percent * 10000) / 100;
                    var speed =
                        parseInt((info.speed / 1024 / 1024) * 100) / 100;
                    console.log(
                        '进度:' + percent + '%; 速度：' + speed + 'Mb/s;'
                    );
                },
                onFileFinish: function (err, data, options) {
                    console.log(
                        options.Key +
                            '上传' +
                            (err ? '失败:' + err.statusCode + err : '完成')
                    );
                    console.log('--------------------------------------------');
                },
            },
            function (err, data) {
                if (err) {
                    console.log(`批量上传错误码: ${err.statusCode}, ${err}`);
                } else {
                    console.log('批量上传完成:', data.options, data.data);
                    console.log(
                        '----------------上传完成，开始刷新 cdn url------------'
                    );
                    const CdnClient = tencentcloud.cdn.v20180606.Client;
                    const clientConfig = {
                        credential: {
                            secretId: COS_SECRET_ID,
                            secretKey: COS_SECRET_KEY,
                        },
                        region: '',
                        profile: {
                            httpProfile: {
                                endpoint: 'cdn.tencentcloudapi.com',
                            },
                        },
                    };
                    const client = new CdnClient(clientConfig);
                    // Note: 需要刷新的 url 地址
                    const refreshList = addAndModifyList.map((fileName) => {
                        return `https://www.xheldon.cn/${fileName}`;
                    });
                    if (refreshList.length) {
                        console.log('CDN 刷新文件列表:', refreshList);
                        const params = {
                            Urls: refreshList,
                        };
                        client.PurgeUrlsCache(params).then(
                            (data) => {
                                console.log('刷新成功:', data);
                            },
                            (err) => {
                                console.error('刷新失败:', err);
                            }
                        );
                    } else {
                        console.log('本次无需 CDN 刷新');
                    }
                }
            }
        );
    } else {
        console.log('本次没有需要上传的文件');
    }

    // Note: 执行删除
    if (removedList.length) {
        cos.deleteMultipleObject(
            {
                Bucket: COS_BUCKET,
                Region: COS_REGION,
                Objects: removedFiles,
            },
            function (err, data) {
                if (err) {
                    console.log('删除过程出现错误:', err);
                } else {
                    console.log('删除结果:', data);
                }
            }
        );
    } else {
        console.log('本次没有需要删除的文件');
    }
};
