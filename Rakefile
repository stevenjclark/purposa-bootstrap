require 'rubygems'
require 'bundler/setup'

Bundler.require(:default)

require 'yaml'
require 'logger'
require 'fileutils'
require 'highline/import'

class AwsDeployer
  def initialize
    @directory_root = Pathname.new(File.dirname(__FILE__))
    @repo_dir = @directory_root.join('tmp', 'repo')

    aws_config_file = @directory_root.join('config', 'aws.yml')
    fail 'Please create the config/aws.yml file (using the config/aws.yml.example file as a template) before running any rake commands' unless File.exists?(aws_config_file)
    @config = YAML.load_file(aws_config_file)

    @css_compressor = YUI::CssCompressor.new
    @js_compressor = Closure::Compiler.new

    setup_aws
  end

  def deploy(version)
    clean_tmp_directory
    clone(version)
    compress
    uploaded_files = upload_to_s3(version)
    invalidate_cloudfront_distribution(uploaded_files)

    logger.info("Deploy complete!")
  end

  private

  def clean_tmp_directory
    return unless Dir.exists?(@repo_dir)
    logger.info("Cleaning directory #{@repo_dir}")
    FileUtils.rm_r(@repo_dir, force: true)
  end

  def clone(version)
    logger.info("Cloning #{version} to #{@repo_dir}")
    FileUtils.mkdir_p(@repo_dir)

    result = system("git rev-parse #{version}")
    unless result
      logger.fatal('Git clone fialed')
      fail 'Git clone failed'
    end

    system("git archive #{version} | tar -x -C #{@repo_dir}")
  end

  def compress
    compress_css
    compress_js
  end

  def compress_css
    logger.info("Minifying/Compressing CSS...")
    Dir.glob(@repo_dir.join('css', '*.css')) do |css_file|
      next if /\.min\.css/ =~ css_file # skip existing minified files
      compressed_file_name = "#{Pathname.new(File.dirname(css_file)).join(File.basename(css_file, '.css'))}.min.css"

      logger.info("  Minifying #{css_file} to #{compressed_file_name}")
      File.open(compressed_file_name, 'w') { |file| file.write(@css_compressor.compress(File.read(css_file))) }

      logger.info("  Compressing #{css_file} to #{css_file}.gz")
      Zlib::GzipWriter.open("#{css_file}.gz", 9) { |gz| gz.write(File.read(css_file)) }

      logger.info("  Compressing #{compressed_file_name} to #{compressed_file_name}.gz")
      Zlib::GzipWriter.open("#{compressed_file_name}.gz", 9) { |gz| gz.write(File.read(compressed_file_name)) }
    end
  end

  def compress_js
    logger.info("Compressing JavaScript...")
    Dir.glob(@repo_dir.join('js', '*.js')) do |js_file|
      next if /\.min\.js/ =~ js_file # skip existing minified files
      compressed_file_name = "#{Pathname.new(File.dirname(js_file)).join(File.basename(js_file, '.js'))}.min.js"

      logger.info("  Minifying #{js_file} to #{compressed_file_name}")
      File.open(compressed_file_name, 'w') { |file| file.write(@js_compressor.compress(File.read(js_file))) }

      logger.info("  Compressing #{js_file} to #{js_file}.gz")
      Zlib::GzipWriter.open("#{js_file}.gz", 9) { |gz| gz.write(File.read(js_file)) }

      logger.info("  Compressing #{compressed_file_name} to #{compressed_file_name}.gz")
      Zlib::GzipWriter.open("#{compressed_file_name}.gz", 9) { |gz| gz.write(File.read(compressed_file_name)) }
    end
  end

  def upload_to_s3(version)
    files = Dir.glob(@repo_dir.join('css/*')) + Dir.glob(@repo_dir.join('images/*')) + Dir.glob(@repo_dir.join('js/*'))
    files_uploaded = []

    logger.info("Starting upload to S3...")

    files.each do |file_path|
      short_path = file_path.gsub("#{@repo_dir.to_s}#{File::SEPARATOR}", '')
      s3_path = "drg-bootstrap/#{version}/#{short_path}"
      mime_type = MIME::Types.type_for(file_path).first.simplified

      logger.info("  Uploading #{s3_path} with Content-Type: #{mime_type}")

      s3_file = aws_s3_bucket.objects[s3_path]
      s3_file.write(File.open(file_path, 'rb'), content_type: mime_type, acl: :public_read)

      files_uploaded << s3_path
    end

    logger.info("Finished uploading to #{files_uploaded.size} files to S3 bucket #{@config[:deploy][:s3_bucket]}")

    files_uploaded
  end

  def invalidate_cloudfront_distribution(files)
    logger.info("Creating CloudFront invalidation request to include the new files...")

    response = aws_cloudfront.create_invalidation(
      distribution_id: @config[:acf][:distribution_id],
      invalidation_batch: {
        paths: {
          quantity: files.size,
          items: files.map { |s3_file_path| "/#{s3_file_path}" }
        },
        caller_reference: "#{Time.now.utc.to_i}"
      }
    )
    invalidation_id = response[:id]

    logger.info("Invalidation request #{invalidation_id} created")

    loop do
      status = aws_cloudfront.get_invalidation(
        distribution_id: @config[:acf][:distribution_id],
        id: invalidation_id
      )
      logger.debug("Invalidation request: #{status.inspect}")

      if status[:status] == 'InProgress'
        logger.info("Invalidation request #{invalidation_id} is still in progress, sleeping for 60 seconds...")
        sleep 60
      elsif status[:status] == 'Completed'
        logger.info("Invalidation request #{invalidation_id} status is #{status[:status]}")
        break
      else
        msg = "Invalidation request #{invalidation_id} status is #{status[:status]}, treating as an error."
        logger.fatal(msg)
        fail msg
      end
    end
  end

  def setup_aws
    AWS.config(access_key_id: @config[:aws][:access_key_id], secret_access_key: @config[:aws][:secret_access_key], region: @config[:aws][:region])
  end

  def aws_s3
    @s3 ||= AWS::S3.new
  end

  def aws_cloudfront
    @cloudfront_client ||= AWS::CloudFront.new.client
  end

  def aws_s3_bucket
    @s3_bucket ||= begin
      bucket = aws_s3.buckets[@config[:deploy][:s3_bucket]]
      fail "Bucket #{@config[:deploy][:s3_bucket]} does not exist" unless bucket.exists?

      bucket
    end
  end

  def logger
    @logger ||= begin
      $stdout.sync = true
      log = Logger.new($stdout)
      log.level = Logger::INFO
      log.formatter = proc do |severity, datetime, progname, msg|
        "[#{datetime.strftime('%F %T.%L')}] [#{severity}] #{msg}\n"
      end

      log
    end
  end
end

namespace :aws do
  desc 'Deploys drg-bootstrap to the CloudFront CDN'
  task :deploy, :tag do |t, args|
    deployer = AwsDeployer.new

    default_tag = proc { `git tag -l | sort -n -t. -k1,1 -k2,2 -k3,3 -k4,4`.chomp.split("\n").last }.call
    tag = args[:tag] || ask("What tag is to be deployed? ") { |q| q.default = default_tag }

    fail 'Tag must not be empty' if tag.empty?

    deployer.deploy(tag)
  end
end
